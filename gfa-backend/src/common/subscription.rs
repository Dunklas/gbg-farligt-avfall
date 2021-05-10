use std::fmt;
use sha2::{Sha512, Digest};
use rand::prelude::*;
use chrono::{Duration, Utc};

#[derive(fmt::Debug)]
pub struct Subscription {
    pub email: String,
    pub location_id: String,
    pub auth_token: Option<String>,
    pub unsubscribe_token: Option<String>,
    pub is_authenticated: bool,
    pub ttl: Option<i64>
}

impl Subscription {
    pub fn new(email: String, location_id: String) -> Self {
        Subscription{
            email,
            location_id,
            auth_token: Some(Subscription::create_token(email, location_id)),
            unsubscribe_token: None,
            is_authenticated: false,
            ttl: Some((Utc::now() + Duration::days(1)).timestamp())
        }
    }
    pub fn verify(&mut self) {
        self.is_authenticated = true;
        self.ttl = None;
        self.auth_token = None;
        self.unsubscribe_token = Some(Subscription::create_token(self.email, self.location_id));
    }

    fn create_token(email: String, location_id: String) -> String {
        let mut random_bytes = [0u8, 32];
        thread_rng().fill_bytes(&mut random_bytes);
        let mut token = Sha512::new();
        token.update(&random_bytes);
        token.update(email.as_bytes());
        token.update(location_id.as_bytes());
        format!("{:x}", token.finalize())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn should_create_subscription() {
        let subscription = Subscription::new("email@email.com".to_owned(), "hisingen_nice".to_owned());
        assert_eq!("email@email.com".to_owned(), subscription.email);
        assert_eq!("hisingen_nice".to_owned(), subscription.location_id);
        assert_eq!(false, subscription.is_authenticated);
    }
}
