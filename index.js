const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron');
const axios = require('axios');
const {Resend}  = require('resend');
const bodyParser = require('body-parser');

let LAST_CHAPTER = 0;

let emails = []

const resend = new Resend(process.env.RESEND_TOKEN);
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.get('/', (req, res) => {
    // checkOnePiece();
    res.send('<h1>Server Online!<h1><br><a href="/addEmail">Add Email</a><br><a href="/checkOnePiece">Check One Piece</a>')
})

app.get('/addEmail', (req, res) => {
    // show a form to add email
    res.send('<form action="/addEmail" method="POST"><input type="text" name="email"><input type="submit" value="Submit"></form>');
}
)

app.get('/checkOnePiece', (req, res) => {
    checkOnePiece();
    res.send('Checking One Piece...' + LAST_CHAPTER);
})

app.post('/addEmail', (req, res) => {
    // // add email to the array
    emails.push(req.body.email);
    sendNewEmail(req.body.email);
    console.log(emails);
    res.send('Email added!');

})

//CRON JOB
cron.schedule('0 */2 * * *', () => {
    console.log('checking one piece')
    checkOnePiece();
});



const port = 5000 || process.env.PORT;
app.listen(port, () => {
    // emails.push(process.env.EMAIL);
    console.log(`Example app listening at http://localhost:${port}`)
})

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
            console.log('New Chapter is out! /n Sending notification...');
            sendNotification(chapter, 'https://tcbscans.com' + link[0]);
        }
        
    }).catch((error) => {
        console.log(error);
    });
}


const sendNotification = async (chapter, link) => {
    console.log('chapter: ' + chapter + ' link: ' + link);

    for (let i = 0; i < emails.length; i++) {
        console.log('sending email to: ' + emails[i]);
        resend.emails.send({
            from: process.env.EMAIL,
            to: emails[i],
            subject: 'One Piece Chapter ' + chapter + ' is out!',
            html: '<p>Link: <strong>'+ link +'</strong>!</p>'
          });
    }

    LAST_CHAPTER = chapter;
};

const sendNewEmail = async (email) => {
    console.log('email: ' + email);
    
    resend.emails.send({
        from: process.env.EMAIL,
        to: process.env.GMAIL,
        subject: 'New Email Added',
        html: '<p>New Email Added: <strong>'+ email +'</strong>!</p>'
      });

};