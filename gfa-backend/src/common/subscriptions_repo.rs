use std::{error, fmt, collections::HashMap};
use rusoto_dynamodb::{DynamoDb, DynamoDbClient, GetItemInput, PutItemInput, QueryInput, AttributeValue};
use rusoto_core::{Region};
use crate::subscription::Subscription;

type Error = Box<dyn std::error::Error + Send + Sync + 'static>;

#[derive(Debug)]
struct MalformedSubscription {
    email: Option<String>,
    auth_token: Option<String>
}
impl fmt::Display for MalformedSubscription {
  fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
    let mut error_message = "Malformed subscription in database.".to_owned();
    if self.email.is_some() {
        error_message.push_str(&format!("Email: {}.", self.email.unwrap()));
    }
    if self.auth_token.is_some() {
        error_message.push_str(&format!("Auth token: {}.", self.auth_token.unwrap()));
    }
    write!(f, "{}", error_message)
  } 
}
impl error::Error for MalformedSubscription {}

#[derive(Debug)]
struct AuthTokenCollision;
impl fmt::Display for AuthTokenCollision {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "More than two subscriptions were found with the same auth_token")
    }
}
impl error::Error for AuthTokenCollision {}

#[derive(Debug)]
struct MalformedDynamoDbResponse;
impl fmt::Display for MalformedDynamoDbResponse {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Malformed response from DynamoDb")
    }
}
impl error::Error for MalformedDynamoDbResponse {}

pub async fn store_subscription(table: &String, region: &Region, subscription: Subscription) -> Result<(), Error> {
    let client = DynamoDbClient::new(region.clone());

    let mut attributes: HashMap<String, AttributeValue> = HashMap::new(); 
    attributes.insert("email".to_owned(), AttributeValue{
        s: Some(subscription.email),
        ..Default::default()
    });
    attributes.insert("location_id".to_owned(), AttributeValue{
        s: Some(subscription.location_id),
        ..Default::default()
    });
    attributes.insert("auth_token".to_owned(), AttributeValue{
        s: Some(subscription.auth_token),
        ..Default::default()
    });
    attributes.insert("is_authenticated".to_owned(), AttributeValue{
        bool: Some(subscription.is_authenticated),
        ..Default::default()
    });
    if subscription.ttl.is_some() {
        attributes.insert("ttl".to_owned(), AttributeValue{
            n: Some(subscription.ttl.unwrap().to_string()),
            ..Default::default()
        });
    }

    match client.put_item(PutItemInput{
        item: attributes,
        table_name: table.clone(),
        ..Default::default()
    }).await {
        Ok(_response) => {
            Ok(())
        },
        Err(err) => {
            Err(Box::new(err))
        }
    }
}

pub async fn get_subscription(table: &String, region: &Region, email: &String, location_id: &String) -> Result<Option<Subscription>, Error> {
    let client = DynamoDbClient::new(region.clone());

    let mut attributes: HashMap<String, AttributeValue> = HashMap::new();
    attributes.insert("email".to_owned(), AttributeValue{
        s: Some(email.clone()),
        ..Default::default()
    });
    attributes.insert("location_id".to_owned(), AttributeValue{
        s: Some(location_id.clone()),
        ..Default::default()
    });

    match client.get_item(GetItemInput{
        table_name: table.clone(),
        key: attributes,
        ..Default::default()
    }).await {
        Ok(response) => {
            let item = match response.item {
                Some(item) => item,
                None => {
                    return Ok(None)
                }
            };
            match item_to_subscription(&item) {
                Some(subscription) => Ok(Some(subscription)),
                None => {
                    Err(Box::new(MalformedSubscription{
                        email: Some(email.clone()),
                        auth_token: None,
                    }))
                }
            }
        },
        Err(err) => {
            Err(Box::new(err))
        }
    }
}

pub async fn get_subscription_by_auth_token(table: &String, region: &Region, auth_token: &String) -> Result<Option<Subscription>, Error> {
    let client = DynamoDbClient::new(region.clone());
    let mut attribute_values = HashMap::new();
    attribute_values.insert(":authToken".to_owned(), AttributeValue{
        s: Some(auth_token.clone()),
        ..Default::default()
    });
    match client.query(QueryInput{
        index_name: Some("byAuthToken".to_owned()),
        table_name: table.clone(),
        expression_attribute_values: Some(attribute_values),
        key_condition_expression: Some("auth_token = :authToken".to_owned()),
        ..Default::default()
    }).await {
        Ok(response) => {
            let items = match response.items {
                Some(items) => items,
                None => return Err(Box::new(MalformedDynamoDbResponse))
            };
            if items.len() == 0 {
                return Ok(None)
            }
            if items.len() > 1 {
                return Err(Box::new(AuthTokenCollision{}))
            }
            let item = items.first().unwrap();
            match item_to_subscription(item) {
                Some(subscription) => Ok(Some(subscription)),
                None => {
                    Err(Box::new(MalformedSubscription{
                        email: None,
                        auth_token: Some(auth_token.clone())
                    }))
                }
            }

        },
        Err(error) => {
            Err(Box::new(error))
        }
    }
}

fn item_to_subscription(item: &HashMap<String, AttributeValue>) -> Option<Subscription> {
    let email = item.get("email")?.s.as_ref()?;
    let location_id = item.get("location_id")?.s.as_ref()?;
    let auth_token = item.get("auth_token")?.s.as_ref()?;
    let is_authenticated = item.get("is_authenticated")?.bool.as_ref()?;
    let ttl = match item.get("ttl") {
        None => None,
        Some(ttl) => Some(ttl.n.as_ref()?.parse::<i64>().ok()?)
    };
    Some(Subscription{
        email: email.clone(),
        location_id: location_id.clone(),
        auth_token: auth_token.clone(),
        is_authenticated: is_authenticated.clone(),
        ttl,
    })
}
