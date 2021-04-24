use std::{collections::HashMap};
use log::{self, LevelFilter};
use simple_logger::SimpleLogger;
use lambda::{handler_fn, Context};
use aws_lambda_events::event::apigw::{ApiGatewayProxyRequest, ApiGatewayProxyResponse};

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
