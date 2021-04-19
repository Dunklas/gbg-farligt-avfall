const https = require('https');
const url = require('url');
const AWS = require('aws-sdk')

const baseUrl = 'https://api.sendgrid.com/v3';

exports.handler = async function (event, context) {
    const { ResourceProperties: properties, RequestType: requestType, PhysicalResourceId: physicalId } = event;
    switch (requestType) {
        case 'Create':
            return handleCreate(properties.apiKey, properties.domain, properties.hostedZoneId);
        case 'Update':
            return handleUpdate(properties.apiKey, physicalId);
        case 'Delete':
            return handleDelete(properties.apiKey, physicalId);
    }
}

const handleCreate = async (apiKey, domain, hostedZoneId) => {
    const authenticationResponse = await createDomainAuthentication(apiKey, domain)
        .catch(error => {
            throw new Error('Failed to authenticate domain: ' + error);
        })
    const {id, dns} = authenticationResponse;
    await addAuthenticationRecords(hostedZoneId, dns)
        .catch(error => {
            // Delete authentication in SendGrid?
            throw new Error('Failed to add CNAME records to Route53: ' + error);
        });
    await retry(() => validateDomainAuthentication(apiKey, id), 'Failed to validate domain authentication')
        .catch(error => {
            throw new Error('Failed to validate domain authentication: ' + error);
        });
    return successfulCloudFormationResponse(id.toString(10), {});
}

const handleUpdate = (apiKey, id) => {
    console.log('UPDATE event');
    throw new Error('Failed to update :(');
}

const handleDelete = async (apiKey, id) => {
    await deleteDomainAuthentication(apiKey, id)
        .catch(error => {
            throw new Error('Failed to delete domain authentication: ' + error);
        })
    return successfulCloudFormationResponse(id, {});
}

const successfulCloudFormationResponse = (physicalResourceId, responseData) => {
    return {
        PhysicalResourceId: physicalResourceId,
        Data: responseData
    };
}

const addAuthenticationRecords = (hostedZoneId, recordsToAdd) => {
    const route53 = new AWS.Route53();
    return route53.changeResourceRecordSets({
        HostedZoneId: hostedZoneId,
        ChangeBatch: {
            Changes: Object.values(recordsToAdd).map(record => ({
                Action: 'CREATE',
                ResourceRecordSet: {
                    Name: record.host,
                    Type: record.type.toUpperCase(),
                    TTL: 300,
                    ResourceRecords: [{
                        Value: record.data
                    }]
                }
            }))
        }
    }).promise();
}

const getAuthenticatedDomains = (apiKey) => {
    const uri = new url.URL(baseUrl + '/whitelabel/domains');
    return makeRequest(uri, {
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + apiKey
        }
    }).then(response => JSON.parse(response));
}

const createDomainAuthentication = (apiKey, domain) => {
    const uri = new url.URL(baseUrl + '/whitelabel/domains');
    return makeRequest(uri, {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + apiKey
        }
    }, JSON.stringify({
        domain,
    })).then(response => JSON.parse(response));
}

const validateDomainAuthentication = (apiKey, id) => {
    const uri = new url.URL(baseUrl + `/whitelabel/domains/${id}/validate`);
    return makeRequest(uri, {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + apiKey
        }
    }).then(response => {
        response = JSON.parse(response)
        if (!response.valid) {
            throw new Error('Invalid domain authentication');
        }
        return response;
    });
}

const deleteDomainAuthentication = (apiKey, id) => {
    const uri = new url.URL(baseUrl + `/whitelabel/domains/${id}`);
    return makeRequest(uri, {
        method: 'DELETE',
        headers: {
            Authorization: 'Bearer ' + apiKey
        }
    });
}

const retry = async (fn, errorMessage, retryCount = 0, lastError = null) => {
    try {
        return await fn();
    } catch (error) {
        if (retryCount > 15) {
            throw new Error(lastError);
        }
        if (errorMessage) {
            console.warn(errorMessage);
        }
        const delayInMs = 2 ** retryCount * 10;
        await delay(delayInMs);
        return retry(fn, errorMessage, retryCount + 1, error);
    }
}

const delay = ms =>
  new Promise(resolve => setTimeout(resolve, ms));

const makeRequest = (uri, options, data) => new Promise((resolve, reject) => {
    if (!uri instanceof url.URL) {
        throw new Error('url must be an instance of url.URL');
    }
    const fullPath = uri.pathname.concat(uri.search ? uri.search : '');
    const req = https.request({
        hostname: uri.hostname,
        path: fullPath,
        method: options.method,
        headers: options.headers,
        protocol: uri.protocol
    }, (res) => {
        res.setEncoding('utf8');
        if (res.statusCode < 200 || res.statusCode > 299) {
            res.on('data', chunk => {});
            return reject(new Error("Bad status code: " + res.statusCode));
        }
        let responseBody = '';
        res.on('data', chunk => {
            responseBody += chunk;
        });
        res.on('end', () => {
            return resolve(responseBody);
        });
    });
    req.on('error', err => {
        return reject(err);
    });
    if (data) {
        req.write(data);
    }
    req.end();
});
