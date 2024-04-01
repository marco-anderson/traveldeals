require('dotenv').config();
const {Firestore} = require('@google-cloud/firestore');
const sgMail = require('@sendgrid/mail');

/**
 * Background Function triggered by a new Firestore document.
 * 
 * @param {!Object} event The cf event. (This case: the actual firestore document.)
 * @param {!Object} context cf event metadata.
 */


exports.sendDeal = (event, context) => {
    const dealLocations = [];

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Print the field named "headline" in the document
    console.log("Headline: ");
    console.log(`${event.value.fields.headline.stringValue}`);

    // Get all locations as strings
    console.log("All locations in document: ");
    event.value.fields.location.arrayValue.values.forEach( (loc) => {
        console.log(loc.stringValue);
        dealLocations.push(loc.stringValue);
    });

    // Location Array
    console.log(`Location array: ${dealLocations}`);

    // Connect to database
    const db = new Firestore({
        projectId: "sp24-41200-mh42-traveldeals"
    });

    // "Subcribers" collection reference
    const subsRef = db.collection('subscribers');

    // Query the "subscribers" collection
    const queryRef = subsRef.where('watch_regions', 'array-contains-any', dealLocations);

    // Actually contacts db and retrieves data
    queryRef.get().then( (querySnapshot) => {
        // Loop through documents in snapshot (always comes back as array)
        querySnapshot.forEach( (doc) => {
            console.log(doc.data().email_address);

            const msg = {
                to: doc.data().email_address,
                from: process.env.SENDGRID_SENDER,
                subject: `(marco) ${event.value.fields.headline.stringValue}`,
                text: "Based on your interests, we found some great deals for you!",
                html: "Based on your interests, we found some <b>great</b> deals for you!"
            };

            sgMail
            .send(msg)
            .then( () => {
                console.log('Email sent.');
            }, error => {
                console.error(error);
            });
        } );
    });

}
