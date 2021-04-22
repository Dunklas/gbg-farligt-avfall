use std::fmt;

#[derive(fmt::Debug)]
pub struct Subscription {
    pub email: String,
    pub location_id: String,
    pub auth_token: String,
    pub is_authenticated: bool,
}
