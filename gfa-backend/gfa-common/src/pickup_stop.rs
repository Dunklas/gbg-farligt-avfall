use std::fmt;
use serde::{Serialize, Deserialize};

#[derive(fmt::Debug)]
#[derive(Serialize)]
#[derive(Deserialize)]
pub struct PickUpStop {
    pub location_id: String,
    pub street: String,
    pub district: String,
    pub description: Option<String>,
}

impl fmt::Display for PickUpStop {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{} - {} ({})\n", self.district, self.street, self.description.as_ref().unwrap_or(&"-".to_string()))
    }
}

impl PartialEq for PickUpStop {
    fn eq(&self, other: &Self) -> bool {
        self.location_id == other.location_id
    }
}

impl PickUpStop {
    pub fn new(location_id: String, street: String, district: String, description: Option<String>) -> Self {
        PickUpStop{
            location_id,
            street,
            district,
            description,
        }
    }
}
