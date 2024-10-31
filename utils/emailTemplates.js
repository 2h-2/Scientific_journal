const httpStatusText = require(".//httpStatusText");
const nodemailer = require("nodemailer");
const connection = require("../DB/connection");
const util = require("util");

const journalInfo = async ()=>{
    const query = util.promisify(connection.query).bind(connection);
    const journal = await query("select title, path, journal_email from journal where id = 1");

    
        const journalTitle =  journal[0].title;
        const journalPath = journal[0].path;
        const journalEmail= journal[0].journal_email;
    return [journalTitle, journalPath]
}
/**
 *`It is my pleasure and therefore to inform you that you are one of the experts who can provide insight into the latest findings in your field.
    I write to invite you to review the following submissions to the Arab Journal of Geosciences:

    Title: Evaluation of various empirical correlations used in predicting the Iraqi Riyal pressure index
    authors)
    The summary is provided at the bottom of this letter.
    
    
    Based on your conclusion is 30 days chosen for you for these events.`
 */
const articleReviewRequest = async (review_date)=>{
    const query = util.promisify(connection.query).bind(connection);
    const email = await query("select subject from emails where name=?", "accept article");
    const journal = await query("select title, path, journal_email from journal where id = 1");

    
    const journalTitle =  journal[0].title;
    const journalPath = journal[0].path;
    const journalEmail= journal[0].journal_email;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: journalEmail,    
            pass: process.env.EMAIL_PASS,     
        },
    });
   

    if(fileArr){
        const mailOptions = {
            from: journalTitle,  
            to: receiverInfo.email,
            subject: `[${journalTitle}] - ${email[0].subject}`,
            text: `Dear ${receiverInfo.userName},
    
I am pleased to inform you that your paper titled [${articleTitle}] has been accepted for publication in ${journalTitle}. Congratulations!
            
${body}
            
${senderInfo.userName}
${senderInfo.email}
    
To visit the web site, please click here: ${journalPath}
    
Best regards,
${journalTitle}
`,
    attachments:[
        ...fileArr
    ]
        };

        transporter.sendMail(mailOptions, (error, info) => {
        
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
    }else{
        const mailOptions = {
            from: journalTitle,  
            to: receiverInfo.email,
            subject: `[${journalTitle}] - ${email[0].subject}`,
            text: `Dear ${receiverInfo.userName},
    
I am pleased to inform you that your paper titled [${articleTitle}] has been accepted for publication in ${journalTitle}. Congratulations!
            
${body}
            
${senderInfo.userName}
${senderInfo.email}
    
To visit the web site, please click here: ${journalPath}
    
Best regards,
${journalTitle}
`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
        
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
        });
    }

}

const assignationEmailToEditor = async (review_date)=>{
    const query = util.promisify(connection.query).bind(connection);
    const email = await query("select subject from emails where name=?", "accept article");
    const journal = await query("select title, path, journal_email from journal where id = 1");

    
    const journalTitle =  journal[0].title;
    const journalPath = journal[0].path;
    const journalEmail= journal[0].journal_email;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: journalEmail,    
            pass: process.env.EMAIL_PASS,     
        },
    });
   

    if(fileArr){
        const mailOptions = {
            from: journalTitle,  
            to: receiverInfo.email,
            subject: `[${journalTitle}] - ${email[0].subject}`,
            text: `Dear ${receiverInfo.userName},
    
I am pleased to inform you that your paper titled [${articleTitle}] has been accepted for publication in ${journalTitle}. Congratulations!
            
${body}
            
${senderInfo.userName}
${senderInfo.email}
    
To visit the web site, please click here: ${journalPath}
    
Best regards,
${journalTitle}
`,
    attachments:[
        ...fileArr
    ]
        };

        transporter.sendMail(mailOptions, (error, info) => {
        
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
    }else{
        const mailOptions = {
            from: journalTitle,  
            to: receiverInfo.email,
            subject: `[${journalTitle}] - ${email[0].subject}`,
            text: `Dear ${receiverInfo.userName},
    
I am pleased to inform you that your paper titled [${articleTitle}] has been accepted for publication in ${journalTitle}. Congratulations!
            
${body}
            
${senderInfo.userName}
${senderInfo.email}
    
To visit the web site, please click here: ${journalPath}
    
Best regards,
${journalTitle}
`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
        
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
        });
    }

}

const decisionAccept = async (articleTitle, body, fileArr, senderInfo, receiverInfo) =>{
    const query = util.promisify(connection.query).bind(connection);
    const email = await query("select subject from emails where name=?", "accept article");
    const journal = await query("select title, path, journal_email from journal where id = 1");

    
    const journalTitle =  journal[0].title;
    const journalPath = journal[0].path;
    const journalEmail= journal[0].journal_email;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: journalEmail,    
            pass: process.env.EMAIL_PASS,     
        },
    });
   

    if(fileArr){
        const mailOptions = {
            from: journalTitle,  
            to: receiverInfo.email,
            subject: `[${journalTitle}] - ${email[0].subject}`,
            text: `Dear ${receiverInfo.userName},
    
I am pleased to inform you that your paper titled [${articleTitle}] has been accepted for publication in ${journalTitle}. Congratulations!
            
${body}
            
${senderInfo.userName}
${senderInfo.email}
    
To visit the web site, please click here: ${journalPath}
    
Best regards,
${journalTitle}
`,
    attachments:[
        ...fileArr
    ]
        };

        transporter.sendMail(mailOptions, (error, info) => {
        
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
    }else{
        const mailOptions = {
            from: journalTitle,  
            to: receiverInfo.email,
            subject: `[${journalTitle}] - ${email[0].subject}`,
            text: `Dear ${receiverInfo.userName},
    
I am pleased to inform you that your paper titled [${articleTitle}] has been accepted for publication in ${journalTitle}. Congratulations!
            
${body}
            
${senderInfo.userName}
${senderInfo.email}
    
To visit the web site, please click here: ${journalPath}
    
Best regards,
${journalTitle}
`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
        
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
        });
    }

      // Send email
    

}

const decisionReject = async (articleTitle, body, fileArr, senderInfo, receiverInfo) =>{
    const query = util.promisify(connection.query).bind(connection);
    const email = await query("select subject from emails where name=?", "reject article");
    const journal = await query("select title, path, journal_email from journal where id = 1");

    
    const journalTitle =  journal[0].title;
    const journalPath = journal[0].path;
    const journalEmail= journal[0].journal_email;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: journalEmail,    
            pass: process.env.EMAIL_PASS,     
        },
    });
   

    if(fileArr){
        const mailOptions = {
            from: journalTitle,  
            to: receiverInfo.email,
            subject: `[${journalTitle}] - ${email[0].subject}`,
            text: `Dear ${receiverInfo.userName},
    
I hope this message finds you well.

After careful consideration and review by our editorial team, I regret to inform you that we will not be able to accept your submitted article titled [${articleTitle}] for publication in our journal.            
                
${body}
            
${senderInfo.userName}
${senderInfo.email}
    
To visit the web site, please click here: ${journalPath}
    
Best regards,
${journalTitle}
`,
    attachments:[
        ...fileArr
    ]
        };

        transporter.sendMail(mailOptions, (error, info) => {
        
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
    }else{
        const mailOptions = {
            from: journalTitle,  
            to: receiverInfo.email,
            subject: `[${journalTitle}] - ${email[0].subject}`,
            text: `Dear ${receiverInfo.userName},

I hope this message finds you well.

After careful consideration and review by our editorial team, I regret to inform you that we will not be able to accept your submitted article titled [${articleTitle}] for publication in our journal.            

${body}
            
${senderInfo.userName}
${senderInfo.email}
    
To visit the web site, please click here: ${journalPath}
    
Best regards,
${journalTitle}
`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
        
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
        });
    }

      // Send email
    

}

const decisionMinorRevision = async (articleTitle, body, fileArr, senderInfo, receiverInfo, revision_date) =>{
    const query = util.promisify(connection.query).bind(connection);
    const email = await query("select subject from emails where name=?", "accept article");
    const journal = await query("select title, path, journal_email from journal where id = 1");

    
    const journalTitle =  journal[0].title;
    const journalPath = journal[0].path;
    const journalEmail= journal[0].journal_email;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: journalEmail,    
            pass: process.env.EMAIL_PASS,     
        },
    });
   

    if(fileArr){
        const mailOptions = {
            from: journalTitle,  
            to: receiverInfo.email,
            subject: `[${journalTitle}] - ${email[0].subject}`,
            text: `Dear ${receiverInfo.userName}, 
    
I am pleased to inform you that after careful review, your article titled [${articleTitle}] has been accepted pending minor revisions for publication in our journal. Congratulations on this achievement!
We ask that you address these reviews before the specified expiration date [${revision_date}]. Once reviews are complete, please resubmit the revised version of your article via our submission system, then add a discussion to let the editor know the review is complete.

${body}
            
${senderInfo.userName}
${senderInfo.email}
    
To visit the web site, please click here: ${journalPath}
    
Best regards,
${journalTitle}
`,
    attachments:[
        ...fileArr
    ]
        };

        transporter.sendMail(mailOptions, (error, info) => {
        
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
    }else{
        const mailOptions = {
            from: journalTitle,  
            to: receiverInfo.email,
            subject: `[${journalTitle}] - ${email[0].subject}`,
            text: `Dear ${receiverInfo.userName},
    
I am pleased to inform you that after careful review, your article titled [${articleTitle}] has been accepted pending minor revisions for publication in our journal. Congratulations on this achievement!
We ask that you address these reviews before the specified expiration date [${revision_date}]. Once reviews are complete, please resubmit the revised version of your article via our submission system, then add a discussion to let the editor know the review is complete.
                        
${body}
            
${senderInfo.userName}
${senderInfo.email}
    
To visit the web site, please click here: ${journalPath}
    
Best regards,
${journalTitle}
`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
        
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
        });
    }

      // Send email
    

}

const decisionMajerRevision = async (articleTitle, body, fileArr, senderInfo, receiverInfo, revision_date) =>{
    const query = util.promisify(connection.query).bind(connection);
    const email = await query("select subject from emails where name=?", "accept article");
    const journal = await query("select title, path, journal_email from journal where id = 1");

    
    const journalTitle =  journal[0].title;
    const journalPath = journal[0].path;
    const journalEmail= journal[0].journal_email;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: journalEmail,    
            pass: process.env.EMAIL_PASS,     
        },
    });
   

    if(fileArr){
        const mailOptions = {
            from: journalTitle,  
            to: receiverInfo.email,
            subject: `[${journalTitle}] - ${email[0].subject}`,
            text: `Dear ${receiverInfo.userName}, 
    
After thorough review by our editorial team, your article titled [${articleTitle}]" has been evaluated as having the potential for publication pending major revisions. While we appreciate the significant effort you've invested in your submission, there are several key areas that require substantial improvement before we can proceed with publication.

We ask that you address these reviews before the specified expiration date [${revision_date}]. Once reviews are complete, please resubmit the revised version of your article via our submission system, then add a discussion to let the editor know the review is complete.

${body}
            
${senderInfo.userName}
${senderInfo.email}
    
To visit the web site, please click here: ${journalPath}
    
Best regards,
${journalTitle}
`,
    attachments:[
        ...fileArr
    ]
        };

        transporter.sendMail(mailOptions, (error, info) => {
        
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
    }else{
        const mailOptions = {
            from: journalTitle,  
            to: receiverInfo.email,
            subject: `[${journalTitle}] - ${email[0].subject}`,
            text: `Dear ${receiverInfo.userName},
    
After thorough review by our editorial team, your article titled [${articleTitle}]" has been evaluated as having the potential for publication pending major revisions. While we appreciate the significant effort you've invested in your submission, there are several key areas that require substantial improvement before we can proceed with publication.

We ask that you address these reviews before the specified expiration date [${revision_date}]. Once reviews are complete, please resubmit the revised version of your article via our submission system, then add a discussion to let the editor know the review is complete.
                        
${body}
            
${senderInfo.userName}
${senderInfo.email}
    
To visit the web site, please click here: ${journalPath}
    
Best regards,
${journalTitle}
`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
        
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
        });
    }

      // Send email
    

}



const emailTemplate = async (title, body, senderInfo, receiverInfo) =>{

    const query = util.promisify(connection.query).bind(connection);
    const journal = await query("select title, path, journal_email from journal where id = 1");

    const journalTitle = journal[0].title;
    const journalPath = journal[0].path;
    const journalEmail = journal[0].journal_email;
    
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: journalEmail,    
            pass: process.env.EMAIL_PASS,     
        },
    });
    console.log(fil)
    const mailOptions = {
        from: journalEmail,  // Replace with your Gmail email address
        to: receiverInfo.email,
        subject: `[${journalTitle}] - ${title}`,
        text: `
        Dear ${receiverInfo.userName},

        ${body}
        
        ${senderInfo.userName}
        ${senderInfo.email}

        To visit the web site, please click here: ${journalPath}

        Best regards,
        ${journalTitle}
        `,

    };

      // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });

}


module.exports = {
    emailTemplate,
    articleReviewRequest,
    decisionAccept,
    decisionReject,
    decisionMinorRevision,
    decisionMajerRevision,
    assignationEmailToEditor
}