use aws_lambda_events::event::apigw::{ApiGatewayProxyRequest, ApiGatewayProxyResponse};
use common::subscriptions_repo::{get_subscription, store_subscription};
use lambda::{handler_fn, Context};
use log::{self, LevelFilter};
use rand::prelude::*;
use rusoto_core::Region;
use simple_logger::SimpleLogger;
use std::{collections::HashMap, env, str::FromStr};

mod add_subscription_request;

type Error = Box<dyn std::error::Error + Send + Sync + 'static>;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let _log = SimpleLogger::new().with_level(LevelFilter::Debug).init();
    let handler = handler_fn(handle_request);
    lambda::run(handler).await?;
    Ok(())
}

async fn handle_request(
    event: ApiGatewayProxyRequest,
    _: Context,
) -> Result<ApiGatewayProxyResponse, Error> {
    let events_table = env::var("SUBSCRIPTIONS_TABLE").unwrap();
    let region = env::var("AWS_REGION").unwrap();
    let region = Region::from_str(&region).unwrap();

    let body = match event.body {
        Some(body) => body,
        None => {
            return Ok(create_response(400, "Missing request body".to_owned()));
        }
    };
    let request: add_subscription_request::AddSubscriptionRequest =
        match serde_json::from_str(&body) {
            Ok(request) => request,
            Err(_error) => {
                return Ok(create_response(400, "Malformed request body".to_owned()));
            }
        };

    match get_subscription(events_table, region, request.email, request.location_id).await {
        Ok(optional_subscription) => match optional_subscription {
            Some(subscription) => {
                if subscription.is_authenticated {
                    return Ok(create_response(
                        400,
                        "Subscription already exist for this e-mail address and location"
                            .to_owned(),
                    ));
                }
            }
            None => {}
        },
        Err(_error) => {
            return Ok(create_response(
                500,
                "Failed to read from database".to_owned(),
            ));
        }
    }
    let mut random_bytes = [0u8; 20];
    thread_rng().fill_bytes(&mut random_bytes);

    return Ok(create_response(200, String::new()));
}

fn create_response(status_code: i64, body: String) -> ApiGatewayProxyResponse {
    let mut headers: HashMap<String, String> = HashMap::new();
    headers.insert(
        "Access-Control-Allow-Headers".to_string(),
        "Content-Type,Accept".to_string(),
    );
    headers.insert(
        "Access-Control-Allow-Methods".to_string(),
        "GET".to_string(),
    );
    headers.insert("Access-Control-Allow-Origin".to_string(), "*".to_string());
    return ApiGatewayProxyResponse {
        status_code: status_code,
        headers: headers,
        multi_value_headers: HashMap::new(),
        body: Some(body),
        is_base64_encoded: None,
    };
}
