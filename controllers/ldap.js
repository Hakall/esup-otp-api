var properties = require(process.cwd() + '/properties/properties');
var ldap;

exports.initialize = function(bind, callback) {
    var LDAP = require('ldap-client');
    ldap = new LDAP({
        uri: properties.esup.ldap.uri, // string
        base: properties.esup.ldap.baseDn, // default base for all future searches
        scope: LDAP.SUBTREE, // default scope for all future searches    
    }, function(err) {
        if (err) console.log(err);
        else {
            ldap.bind({
                binddn: properties.esup.ldap.adminDn,
                password: properties.esup.ldap.password
            }, function(err) {
                if (err) console.log(err);
                else {
                    console.log("ldap controller initialized");
                    if (typeof(callback) === "function") callback();
                }
            });
        }
    });
}


exports.get_available_transports = function(req, res, next) {
    console.log("get_available_transports");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var response = {
        "code": "Error",
        "message": properties.messages.error.user_not_found
    };
    ldap.search({
        attrs: properties.esup.ldap.transport.mail + ' ' + properties.esup.ldap.transport.sms,
        filter: 'uid=' + req.params.uid
    }, function(err, data) {
        if (err) console.log("search error: " + err);
        if (data[0]) {
            var result = {};
            if (data[0][properties.esup.ldap.transport.sms]) {
                var tel = "******" + data[0][properties.esup.ldap.transport.sms][0].substr(data[0][properties.esup.ldap.transport.sms][0].length - 4, 4);
                result.sms = tel;
            };
            if (data[0][properties.esup.ldap.transport.mail]) {
                var size = data[0][properties.esup.ldap.transport.mail][0].length - 10;
                var email = data[0][properties.esup.ldap.transport.mail][0].substr(0, 4);
                for (var i = 0; i < size; i++) {
                    email += '*';
                }
                email += data[0][properties.esup.ldap.transport.mail][0].substr(data[0][properties.esup.ldap.transport.mail][0].length - 6, 6)
                result.mail = email;
            };
            response.code = "Ok";
            response.message = properties.messages.success.transports_found;
            response.transports_list = result;
            res.send(response);
        } else res.send(response);
    });
}


exports.send_sms = function(uid, callback, res) {
    ldap.search({
        attrs: properties.esup.ldap.transport.sms,
        filter: 'uid=' + uid
    }, function(err, data) {
        if (err) console.log("search error: " + err);
        if (data[0]) {
            if (typeof(callback) === "function" && data[0][properties.esup.ldap.transport.sms]) callback(data[0][properties.esup.ldap.transport.sms][0]);
        } else res.send({
            "code": "Error",
            "message": properties.messages.error.user_not_found
        });
    });
}


exports.send_mail = function(uid, callback, res) {
    ldap.search({
        attrs: properties.esup.ldap.transport.mail,
        filter: 'uid=' + uid
    }, function(err, data) {
        if (err) console.log("search error: " + err);
        if (data[0]) {
            if (typeof(callback) === "function" && data[0][properties.esup.ldap.transport.mail]) callback(data[0][properties.esup.ldap.transport.mail][0]);
        } else res.send({
            "code": "Error",
            "message": properties.messages.error.user_not_found
        });
    });
}

exports.send_app = function(uid, callback, res) {
    ldap.search({
        attrs: 'uid',
        filter: 'uid=' + uid
    }, function(err, data) {
        if (err) console.log("search error: " + err);
        if (data[0]) {
            if (typeof(callback) === "function") callback();
        } else res.send({
            "code": "Error",
            "message": properties.messages.error.user_not_found
        });
    });
}
