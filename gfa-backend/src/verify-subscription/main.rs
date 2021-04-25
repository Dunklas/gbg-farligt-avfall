use std::{env, str::FromStr, collections::HashMap};
use log::{self, info, LevelFilter};
use simple_logger::SimpleLogger;
use lambda::{handler_fn, Context};
use aws_lambda_events::event::apigw::{ApiGatewayProxyRequest, ApiGatewayProxyResponse};
use rusoto_core::Region;
use common::subscriptions_repo::{get_subscription, store_subscription};

type Error = Box<dyn std::error::Error + Send + Sync + 'static>;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let _log = SimpleLogger::new().with_level(LevelFilter::Info).init();
    let handler = handler_fn(handle_request);
    lambda::run(handler).await?;
    Ok(())
}

async fn handle_request(
    event: ApiGatewayProxyRequest,
    _: Context,
) -> Result<ApiGatewayProxyResponse, Error> {
    let subscriptions_table = env::var("SUBSCRIPTIONS_TABLE").unwrap();
    let region = env::var("AWS_REGION").unwrap();
    let region = Region::from_str(&region).unwrap();

    let auth_token = match event.query_string_parameters.get("auth_token") {
        Some(auth_token) => auth_token,
        None => {
            return Ok(create_response(400, "Missing authentication token".to_owned()));
        }
    };
    info!("{:?}", event.path_parameters);
    info!("{:?}", event.query_string_parameters);
    Ok(create_response(200, "Hello verify!".to_owned()))
}

fn create_response(status_code: i64, body: String) -> ApiGatewayProxyResponse {
    let mut headers: HashMap<String, String> = HashMap::new();
    headers.insert(
        "Access-Control-Allow-Headers".to_string(),
        "Content-Type,Accept".to_string(),
    );
    headers.insert(
        "Access-Control-Allow-Methods".to_string(),
        "POST".to_string(),
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
