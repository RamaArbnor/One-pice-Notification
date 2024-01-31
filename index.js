const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron');
const axios = require('axios');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const LAST_CHAPTER = 0;

let emails = []

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));


app.get('/', (req, res) => {
    // checkOnePiece();
    res.send('<h1>Server Online!<h1><br><a href="/addEmail">Add Email</a>')
})

app.get('/addEmail', (req, res) => {
    // show a form to add email
    res.send('<form action="/addEmail" method="POST"><input type="text" name="email"><input type="submit" value="Submit"></form>');
}
)

app.post('/addEmail', (req, res) => {
    // // add email to the array
    emails.push(req.body.email);
    console.log(emails);
    res.send('Email added!');

})

//CRON JOB
cron.schedule('0 */2 * * *', () => {
    checkOnePiece();
});



const port = 5000 || process.env.PORT;
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))

function checkOnePiece(){
    // send get request to website and store the output in a variable
    const url = 'https://tcbscans.com/';
    axios.get(url).then((response) => {
        const html = response.data;
        // get the a tag that has 'One Piece Chapter'
        const onePiece = html.match(/One Piece Chapter/g);
        // get the href of the a tag
        const href = html.match(/href="([^"]*)/g);
        // get the link that contains 'one-piece-chapter'
        const link = href.filter((item) => item.includes('one-piece-chapter'));
        console.log(link[0]);
        link[0] = link[0].replace('href="', '');
        // get the chapter number from the link, the structure is like this 'one-piece-chapter-1000'
        const chapter = link[0].split('-')[3];
        console.log('LAST CHAPTER: ' + LAST_CHAPTER + ' CURRENT CHAPTER: ' + chapter);
        // if the chapter number is not the same as the last chapter number, send a notification
        if (chapter !== LAST_CHAPTER) {
            sendNotification(chapter, 'https://tcbscans.com' + link[0]);
        }
        
    }).catch((error) => {
        console.log(error);
    });
}

function sendNotification(chapter, link){
    console.log('chapter: ' + chapter + ' link: ' + link);
    // send email notification
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com", 
        port: 587,
        secure: false, 
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });

    for (let i = 0; i < emails.length; i++) {
    transporter.sendMail({
        from: process.env.EMAIL,
        to: emails[i],
        subject: 'One Piece Chapter ' + chapter + ' is out!',
        text: 'Link: ' + link
    }, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
    }
    
    LAST_CHAPTER = chapter;


}   