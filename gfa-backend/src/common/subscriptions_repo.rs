use std::{collections::HashMap};
use rusoto_dynamodb::{DynamoDb, DynamoDbClient, PutItemInput, AttributeValue};
use rusoto_core::{Region};
use crate::subscription::Subscription;

type Error = Box<dyn std::error::Error + Send + Sync + 'static>;

pub async fn store_subscription(table: String, region: Region, subscription: Subscription) -> Result<(), Error> {
    let client = DynamoDbClient::new(region);

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

    match client.put_item(PutItemInput{
        item: attributes,
        table_name: table,
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
