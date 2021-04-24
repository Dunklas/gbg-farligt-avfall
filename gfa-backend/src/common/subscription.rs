use std::fmt;
use sha1::{Sha1};
use rand::prelude::*;

#[derive(fmt::Debug)]
pub struct Subscription {
    pub email: String,
    pub location_id: String,
    pub auth_token: String,
    pub is_authenticated: bool,
}

impl Subscription {
    pub fn new(email: String, location_id: String) -> Self {
        let mut random_bytes = [0u8; 20];
        thread_rng().fill_bytes(&mut random_bytes);
        let mut auth_token = Sha1::new();
        auth_token.update(&random_bytes);
        auth_token.update(email.clone().as_bytes());
        auth_token.update(location_id.clone().as_bytes());

        Subscription{
            email: email,
            location_id: location_id,
            auth_token: auth_token.digest().to_string(),
            is_authenticated: false
        }
    }
}
