'use strict'

const
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express().use(bodyParser.json());

const request = require('request');

require('dotenv').load();

app.post('/webhook', (req,res) => {

    let body = req.body;

    if(body.object === 'page'){
        body.entry.forEach(function(entry){
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }

        });

        res.status(200).send('EVENT_RECEIVED')

    }else{
        res.sendStatus(404)
    }

})


// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "bot1nmobiliario14"

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {

        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);

      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);
      }
    }
  });


  // Handles messages events
    function handleMessage(sender_psid, received_message) {

        let response;

        //check if the message contains text
        if(received_message.text){

            //create the payload for a basic text message
            response = {
                "text": `Enviaste el mensaje: "${received_message.text}". Ahora envíame una imagen!`
            }

        }else if(received_message.attachments){
            //gets the url of the message attachment
            let attachment_url = received_message.attachments[0].payload.url;
            response = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": [{
                            "title": "Es esta tu imagen?",
                            "subtitle": "Presiona un botón para contestar.",
                            "image_url": attachment_url,
                            "buttons": [
                                {
                                    "type": "postback",
                                    "title": "Si!",
                                    "payload": "yes",
                                },
                                {
                                    "type": "postback",
                                    "title": "No!",
                                    "payload": "no",
                                }
                            ],
                        }]
                    }
                }
            }
        }

        callSendAPI(sender_psid, response)

    }

    // Handles messaging_postbacks events
    function handlePostback(sender_psid, received_postback) {

        let response;

        //Get the payload for the postback
        let payload = received_postback.payload

        //set the response based on the postback payload
        if(payload === 'yes'){
            response = {"text": "Gracias!"}
        }else if(payload === 'no'){
            response = {"text": "Oops, intenta subir otra imagen"}
        }

        //Send message
        callSendAPI(sender_psid, response);

    }

    // Sends response messages via the Send API
    function callSendAPI(sender_psid, response) {
        //Construct the message body
        let request_body = {
            "recipient": {
                "id": sender_psid
            },
            "message": response
        }

        //Send http request to messenger platform
        request({
            "uri": "https://graph.facebook.com/v2.6/me/messages",
            "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
            "method": "POST",
            "json": request_body
        }, (err, res, body) => {
            if(!err){
                console.log("message sent!")
            }else{
                console.log("No se pudo enviar el mensaje: " + err);
            }
        })

    }


app.listen(process.env.PORT || 3030, () => console.log('SUCCESS'));