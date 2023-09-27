const express = require("express");
const app = express();
const bodyParser = require("body-parser");
var passwordHash = require('password-hash');
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
const admin = require("firebase-admin");
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require("./key.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();
app.get('/', function (req, res) {
    res.sendFile(__dirname + "/public/" + "home.html");
})
app.post('/registerPage', function (req, res) {
    const { Fname, Email, Password } = req.body;
    if (!Fname || !Email || !Password) {
        res.status(400).send("All fields are required.");
        return;
    }
    db.collection('Data')
        .where("Email", "==",req.body.Email)
        .get()
        .then((docs) => {
            if (docs.size > 0) {
                res.send("Email already exists");
            }
            else {
                
                if (!Password) {
                    return res.send("Password is required");
                }
                console.log(req.body);
                
                db.collection('Data').add({
                    Username: Fname,
                    Email: Email,
                    Password: passwordHash.generate(Password)
                }).then(() => {
                    res.sendFile(__dirname + "/public/" + "login.html");
                }).catch((error) => {
                    console.error("Error storing data in Firestore: ", error);
                    res.status(500).send("Internal server error");
                });
            }
        });
})
app.post('/loginPage', function (req, res) {
    const { Email, Password } = req.body;
    db.collection('Data')
        .where("Email", "==", Email)
        .get()
        .then((docs) => {
            let verified = false;
            docs.forEach((doc) => {
                verified = passwordHash.verify(req.body.Password, doc.data().Password);
            });

            if (verified) {
                res.sendFile(__dirname + "/public/" + "dashboard.html");
            } else {
                res.send("Oops User not found");
            }
        })
        .catch((error) => {
            console.error("Error querying Firestore: ", error);
            res.status(500).send("Internal server error");
        });
});
app.listen(3000, function () {
    console.log("Server Started");
})