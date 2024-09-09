const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const sgMail = require('@sendgrid/mail');
const app = express();

app.use(express.static('Public')); 
app.use(bodyParser.urlencoded({ extended: true }));


sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.listen(3000, function () {
    console.log('Server is listening on port number 3000');
});

app.get('/', function (request, response) {
    response.sendFile(__dirname + '/index.html');
});

app.post('/', function (request, response) {
    const fname = request.body['First-Name'];
    const lname = request.body['Second-Name'];
    const email = request.body['Email'];

    console.log(fname, lname, email);

    const data = {
        contacts: [
            {
                email: email,
                first_name: fname,
                last_name: lname
            }
        ]
    };

    const requestOptions = {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`
        }
    };

    const url = 'https://api.sendgrid.com/v3/marketing/contacts';


    const req = https.request(url, requestOptions, (apiResponse) => {
        let body = '';

        apiResponse.on('data', (chunk) => {
            body += chunk;
        });

        apiResponse.on('end', () => {
            if (apiResponse.statusCode === 202) {
                console.log('Response from SendGrid:', body);

                const msg = {
                    to: email,
                    from: 'kavishchoudhary1935@gmail.com',
                    subject: 'Thank you for signing up!',
                    text: `Hello ${fname} ${lname},\n\nThank you for signing up! We will keep you updated.`,
                    html: `<strong>Hello ${fname} ${lname},</strong><br><br>Thank you for signing up! We will keep you updated.`
                };

                sgMail
                    .send(msg)
                    .then(() => {
                        console.log('Email sent');
                        response.send('Form data received, sent to SendGrid, and email has been sent.');
                    })
                    .catch((error) => {
                        console.error('Error sending email:', error);
                        response.send('Form data received and sent to SendGrid, but failed to send email.');
                    });
            } else {
                console.error(`Error: ${apiResponse.statusCode} - ${body}`);
                response.send('Failed to send data to SendGrid.');
            }
        });
    });

    req.on('error', (e) => {
        console.error(e);
        response.send('There was an error connecting to SendGrid.');
    });

    req.write(JSON.stringify(data));
    req.end();
});
