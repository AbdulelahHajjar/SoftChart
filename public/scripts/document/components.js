const canvas = document.getElementById("canvas");

var componentsListener;
var connectionsListener;

var components = [];
var connections = [];
var drawnConnections = [];

var connectFromId;

var draggingComponent = null;
var currentModifyingComponent = null;

/*
    This method is used to achieve two goals. And it is called when ever the document gets clicked.
    1- If a user was modifying a component (e.g. changing the class name),
    this method will call the "updateComponent" method which will save the modified component to the database.

    2- If the user initiated a "connection" process (i.e. connecting two components with a line),
    this method will abort the connection process and hide the connection prompt.
*/

document.onclick = function() {
    //If the document was clicked, and a connection was initiated, abort the connection.
    if (connectFromId != null) { abortConnectingComponents(); }
    if (currentModifyingComponent != null) { updateRecentlyModifiedComponent(); }
}

function abortConnectingComponents() {
    setConnectionPromptHidden(true);
    connectFromId = null;
}

function updateRecentlyModifiedComponent() {
    updateComponent(documentObject.id, currentModifyingComponent.id, { textContents: currentModifyingComponent.textContents });
    currentModifyingComponent = null;
}

function allowDrop(ev) {
    ev.preventDefault();
}

function dragComponent(ev, componentType) {
    ev.dataTransfer.setData("ComponentType", componentType);
}

function drawComponents(components) {
    for (index in components) {
        drawComponent(components[index]);
    }
}

function drawComponent(component) {
    var html = component.getHTMLElement();
    html.style.left = (component.x - 10) + "px";
    html.style.top = (component.y - 10) + "px";
    canvas.append(html);
    makeComponentDraggable(html, component);
    setComponentEventHandlers(component.id);
}

function attachDocumentComponentsListener() {
    if (this.componentsListener) { return; }

    componentsListener = firestore
        .collection('documents')
        .doc(documentObject.id)
        .collection('components')
        .onSnapshot(function (querySnapshot) {
            clearAllComponents();
            var components = [];
            querySnapshot.forEach(function (doc) {
                components.push(new Component(doc.id, doc.data().type, doc.data().textContents, doc.data().x, doc.data().y));
            });
            drawComponents(components);
        
        attachDocumentConnectionsListener();
    });
}

function clearAllComponents() {
    canvas.innerHTML = "";
}

function handleDeletionClick(clickedId) {
    for (connectionIndex in this.connections) {
        var conc = this.connections[connectionIndex];
        if (conc.fromId == clickedId || conc.toId == clickedId) {
            deleteConnection(documentObject.id, conc.id);
        }
    }
    
    deleteComponent(ocumentObject.id, clickedId);
}

function deleteComponent(docId, compId) {
    firestore
        .collection('documents')
        .doc(docId)
        .collection('components')
        .doc(compId)
        .delete();
}

function addComponent(docId, component) {
    firestore
        .collection('documents')
        .doc(docId)
        .collection('components')
        .withConverter(componentConverter)
        .add(component)
}

function updateComponent(docId, compId, fields) {
    firestore
        .collection('documents')
        .doc(docId)
        .collection('components')
        .doc(compId)
        .update(fields);
}