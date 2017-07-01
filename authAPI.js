console.log('In authAPI.js');

var AWS = require('aws-sdk');

var dynamodb = new AWS.DynamoDB();

/*
 * getUser: get signed up user from dynamoDB table.
 */
function getUser(email, fn) {
    dynamodb.getItem({
        TableName: 'LambdAuthUsers',
        Key: {
            email: {
                S: email
            }
        }
    }, function(err, data) {
        if (err) return fn(err);
        else {
            if ('Item' in data) {
                var verified = data.Item.verify.BOOL;
                var name = data.Item.name.S;
                var gender = data.Item.gender.S;
                var role = data.Item.role.S;
                fn(null, verified, name, gender, role);
            } else {
                fn(null, 'user not found');//User not found
            }
        }
    });
}

/*
 *  updateUser: update dynamoDB table's attribute "verify"
 */
function updateUser(email, fn) {
    dynamodb.updateItem({
        TableName: 'LambdAuthUsers',
        Key: {
            email: {
                S: email
            }
        },
        AttributeUpdates: {
            verify: {
                Action: 'PUT',
                Value: {
                    BOOL: true
                }
            }
        }
    },
    fn);
}


/*
 * createMember: create new member's profile to member sheet in dynamoDB.
 */
function createMember(name, gender, role, fn) {
    var p = {
        TableName: "memberSheet"
    };
    dynamodb.describeTable(p, function(err, data) {
        if (err) return fn(err);
        else {
            console.log(data.Table);
            var id = data.Table.ItemCount;
            var memberID = String(id);
            var params = {
                Item: {
                    "memberID": {
                        "S": memberID
                    },
                    "name": {
                        "S": name
                    },
                    "gender": {
                        "S": gender
                    },
                    "role": {
                        "S": role
                    }
                }, 
                TableName: 'memberSheet'
            };
            dynamodb.putItem(params, function(err, data){
                if (err) return fn(err);
                else { 
                    fn(null, null);
                }
            });
        }
    });
}


/*
 * lambda main function
 */
exports.handler = function(event, context, callback) {
    var e = event.email;
    console.log(e);
    getUser(e, function(err, verified, name, gender, role){
        if (err) {
            console.log('error in getUser: '+ err);
        } else if (verified) {
            console.log('User already verified: '+ e);
            callback(null, 'User already verified: ' + e);
        } else if (!verified && verified !== null) {
            //update User
            updateUser(e, function(err, data) {
                if (err) {
                    console.log('Error in updateUser: '+ err);
                } else {
                    console.log('user update successfully! '+ e);
                    createMember(name, gender, role, function(err, data){
                        if (err) {
                            console.log('Error in createMember: ' + err);
                        } else {
                            console.log('successfully done everything!!');
                            callback(null, 'successful!!');
                        }
                    });
                }
            }); 
        } else {
            callback(null, 'User not found!');
        }
    });

}

