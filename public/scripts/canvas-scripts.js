const auth = firebase.auth();
const firestore = firebase.firestore();

const myDocs = document.getElementById("DocsButton");
const umcButton = document.getElementById("user-management-button");
const canvasShadowDiv = document.getElementById("canvas-shadow");
const userManagementDiv = document.getElementById("user-management");
const inviteEmailTextField = document.getElementById("invite-email-text-field");
const inviteButton = document.getElementById("invite-button");
const documentUsersDiv = document.getElementById("document-users");

var userId;
var docId = findGetParameter("id");
var documentObject;

var documentUsersListener;

window.onload = function() {
    $.getScript("scripts/models/Invitation.js");
};

auth.onAuthStateChanged(user => {
    if (user) {
        userId = user.uid
        loadData();
    } else {
        unsubscribeListeners();
        auth.signOut()
        window.location.replace("/index.html")
    }
})

function loadData() {
    documentUsersListener = getDocumentUsersListener();
}

function unsubscribeListeners() {
    if (documentUsersListener != null) {
        documentUsersListener.unsubscribe()
    }
}

function getDocumentUsersListener() {
    firestore
        .collection('documents')
        .doc(docId)
        .onSnapshot(documentSnapshot => {
            let documentExists = documentSnapshot.exists;
            let documentData = documentSnapshot.data();

            this.documentObject = documentData;

            if (documentExists) {
                setUsersHTML(documentData.users)
            } else {
                redirectToIndex();
            }
        }, err => {
            redirectToIndex();
        });
}

function redirectToIndex() {
    //TODO: Implement
}

function setUsersHTML(documentUsers) {
    documentUsersDiv.innerHTML = "";
    for (userIndex in documentUsers) {
        let user = documentUsers[userIndex];
        console.log(this.document.adminUid);
        documentUsersDiv.append(createUserHTMLElement(user, user == this.documentObject.adminUid));
    }
}

function createUserHTMLElement(email, isAdmin) {
    var userInformationDiv = document.createElement("div");
    userInformationDiv.className = "user-information";

    var userImg = document.createElement("img");
    userImg.src = "images/user.svg";
    userImg.className = "document-user-icon";

    var userEmailP = document.createElement("p");
    userEmailP.className = "user-email";
    userEmailP.innerHTML = email;

    if (isAdmin) {
        var documentAdminStarIcon = document.createElement("img");
        documentAdminStarIcon.src = "images/document-admin-icon-gold.svg";
        documentAdminStarIcon.id = "document-admin-icon";
        
        userInformationDiv.append(userImg, userEmailP, documentAdminStarIcon);
    } else {
        var deleteButton = document.createElement("button");
        deleteButton.id = "delete-user";
        deleteButton.innerHTML = "Delete";

        userInformationDiv.append(userImg, userEmailP, deleteButton);
    }
    return userInformationDiv
}

myDocs.onclick = function () {
    location.href = "documents.html";
};

umcButton.onclick = function() {
    $(`#${canvasShadowDiv.id}`).css({"z-index": "1"});
    $(`#${userManagementDiv.id}`).css({"z-index": "1"});
    $(`#${canvasShadowDiv.id}`).fadeIn('slow');
    $(`#${userManagementDiv.id}`).fadeIn('slow');
}

canvasShadowDiv.onclick = function() {
    $(`#${canvasShadowDiv.id}`).fadeOut('slow', function() {
        $(`#${canvasShadowDiv.id}`).css({"z-index": "0"});
    });

    $(`#${userManagementDiv.id}`).fadeOut('slow', function() {
        $(`#${userManagementDiv.id}`).css({"z-index": "0"});
    });
}

inviteButton.onclick = async function() {
    let email = inviteEmailTextField.value;

    if (email == null || email == "" || !isValidEmail(email)) {
        alert("Error: Please enter a valid email.");
        return
    }

    let recipientId = await userIdWithEmail(email);

    if (recipientId != null) {
        invitationSentPreviously = await checkIfInviteSentPreviously(recipientId);

        if (invitationSentPreviously) {
            alert(`An invitation has already been sent to the user with email: ${email}.`);
            return
        }

        sendInvite(recipientId);
        alert(`An invitation to the user with the email ${email} was sent successfully.`);

    } else {
        alert(`No user with the email ${email} exists.`);
        return
    }
}

function isValidEmail(email) {
    if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email)) {
        return true
    }
    return false
}

async function checkIfInviteSentPreviously(recipientId) {
    let invitationsRef = firestore
        .collection('invitations');

    let activeRef = await invitationsRef
        .where("recipientId", "==", recipientId)
        .where("status", "==", "UNDECIDED")
        .get();

    return activeRef.length > 0
}

async function userIdWithEmail(recipientEmail) {
    let usersRef = firestore
        .collection('users');

    let activeRef = await usersRef
        .where("email", "==", recipientEmail)
        .get();
        
    for (docIndex in activeRef.docs) {
        if (activeRef.docs[docIndex].data().email == recipientEmail) {
            return activeRef.docs[docIndex].id
        }
    }

    return null;
}

function sendInvite(recipientId) {
    var invitation = Invitation.create(docId, userId, recipientId);

    firestore
        .collection('invitations')
        .withConverter(invitationConverter)
        .add(invitation)
}

function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}