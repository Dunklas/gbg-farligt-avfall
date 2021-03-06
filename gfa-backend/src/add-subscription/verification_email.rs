use std::collections::HashMap;
use common::send_email::{From, Recipient, SendEmailRequest};
use common::subscription::Subscription;
use common::pickup_stop::PickUpStop;

pub fn create_request(subscription: &Subscription, stop: &PickUpStop, email_domain: &str, verify_url: &str) -> SendEmailRequest {
    let html_content = include_str!("verification_email.html");
    SendEmailRequest {
        from: From {
            name: "Göteborg Farligt Avfall Notifications".to_owned(),
            email: format!("noreply-farligtavfall@{}", email_domain),
        },
        subject: "Please verify your subscription".to_owned(),
        recipients: vec![Recipient {
            email: subscription.email.to_owned(),
            substitutions: [
                ("-verifyUrl-".to_owned(), format!("{}?email={}&auth_token={}", verify_url, subscription.email.to_owned(), subscription.auth_token.to_owned().unwrap())),
                ("-street-".to_owned(), stop.street.clone()),
                ("-district-".to_owned(), stop.district.clone()),
            ]
            .iter()
            .cloned()
            .collect::<HashMap<String, String>>(),
        }],
        html_content: html_content.to_owned(),
    }
}
