// flag for recording time and logging to console
var timer = false;
var start, lap;

// 0-11 mapped to month name
var months = [
    "January"  , "February", "March"   , "April",
    "May"      , "June"    , "July"    , "August",
    "September", "October" , "November", "December"
];

// default url endings
var defaultUrlThis = "/content?filterID=contentstatus%5Bpublished%5D~objecttype~showall~action~action%5Boutdated%5D";
var defaultUrlAll = "/content?filterID=all~objecttype~showall~action~action%5Boutdated%5D";
jive.tile.onOpen(function(config, options) {
    gadgets.window.adjustHeight();

    // set defaults for config
    config.numResults = config.numResults || 10;
    config.qType = config.qType || "all";
    config.place = config.place || "sub";

    jive.tile.getContainer(function(container) {
        var results = [];
        var pending = 0;

        $("#question-input").keypress(function(e) {
            if (e.which == 13) {
                if (timer) {
                    start = Date.now();
                }
                getQuestions($(this).val());
            }
        })

        function getQuestions(query, startIndex = 0) {

            var reqQuestions = osapi.jive.corev3.contents.get({
                search: query,
                type: "discussion",
                count: 100,
                fields: "question,resolved,subject,author.displayName,published,iconCss",
                startIndex: startIndex
            });
            reqQuestions.execute(function(res) {
                if (res.error) {
                    var code = res.error.code;
                    var message = res.error.message;
                    console.log(code + " " + message);
                    // present the user with an appropriate error message
                } else {
                    if (timer) {
                        lap = Date.now();
                        console.log("query took " + (lap - start) + " ms");
                    }

                    for (var r of res.list) {
                        if (r.question && (config.qType === "all" || r.resolved.indexOf(config.qType) !== -1)) {
                            results.push(r);
                        }
                        if (results.length === config.numResults) {
                            break;
                        }
                    }

                    if (res.links && res.links.next && results.length < config.numResults) {
                        getQuestions(query, startIndex + 100);
                    } else {
                        showResults();
                    }
                }
            });
        }

        function showResults() {
            var ul = document.getElementById("result-list");

            // remove existing results
            while (ul.hasChildNodes()) {
                ul.removeChild(ul.lastChild);
            }

            for (var r of results) {
                var li = document.createElement("li");
                var a = document.createElement("a");
                a.setAttribute('target', "_top");
                a.setAttribute('href', r.resources.html.ref);
                var icon = document.createElement("span");
                icon.classList.add(r.iconCss, "jive-icon-med");
                var subj = document.createElement("span");
                subj.classList.add("lnk");
                subj.appendChild( document.createTextNode(r.subject) );
                var em = document.createElement("em");
                emText = document.createTextNode("asked by " + r.author.displayName + " on " + formatDate(r.published));
                em.appendChild(emText);

                a.appendChild(icon);
                a.appendChild(subj);
                a.appendChild(em);
                li.appendChild(a);
                ul.appendChild(li);
            }

            results = [];

            if (timer) {
                console.log("creating nodes took " + (Date.now() - lap) + " ms");
            }
            gadgets.window.adjustHeight();
        }

        function setDefaultUrl(placeID, parentUrl, config) {
            if (config.place === "all") {
                var endOfBaseUrl = parentUrl.indexOf("/", "https://".length);
                config.linkUrl = parentUrl.substring(0, endOfBaseUrl);
                config.linkUrl += defaultUrlAll;
            } else {
                var reqSubspace = osapi.jive.corev3.places.get({
                    uri: "/places/" + placeID
                });
                reqSubspace.execute(function(res) {
                    if (res.error) {
                        var code = res.error.code;
                        var message = res.error.message;
                        console.log(code + " " + message);
                        // present the user with an appropriate error message
                    } else {
                        config.linkUrl = res.resources.html.ref + defaultUrlThis;
                    }
                });
            }
        }

        function formatDate(dateStr) {
            var date = new Date(dateStr);
            return (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear();
        }

        function showDocs() {
            // sort by reverse chronological order if needed
            if (config.place === "sub") {
                docList.sort(function(a, b) {
                    return b.lastAct - a.lastAct;
                });
            }

            var ul = document.getElementById("ul-list");
            var table = document.getElementById("content-table");
            var link = document.getElementById("link");

            for (var doc of docList) {
                // create list node
                var li = document.createElement("li");
                li.classList.add("listItem", "showIcon");
                var a = document.createElement("a");
                a.setAttribute('target', "_top");
                a.setAttribute('href', doc.url);
                var icon = document.createElement('span');
                icon.classList.add(doc.icon, "jive-icon-med");
                var docSubj = document.createTextNode(doc.subject);
                a.appendChild(icon);  
                a.appendChild(docSubj);
                li.appendChild(a);  
                ul.appendChild(li);

                // create table row node
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = td1.cloneNode(), td3 = td1.cloneNode();
                td1.appendChild(a.cloneNode(true));
                var authorUrl = a.cloneNode();
                authorUrl.setAttribute("href", doc.authorUrl);
                var avatar = document.createElement("img");
                avatar.classList.add("img-circle", "avatar");
                avatar.setAttribute("src", doc.avatar);
                avatar.setAttribute("height", "30px");
                authorUrl.appendChild(avatar);
                var author = document.createTextNode(doc.author);
                authorUrl.appendChild(author);
                td2.appendChild(authorUrl);
                var postDate = new Date(doc.postDate);
                var postDateNode = document.createTextNode(formatDate(postDate));
                td3.appendChild(postDateNode);
                tr.appendChild(td1);
                tr.appendChild(td2);
                tr.appendChild(td3);
                table.appendChild(tr);
            }
            if (config.showLink) {
                link.setAttribute("href", config.linkUrl);
                var linkText = document.createTextNode(config.linkText);
                link.appendChild(linkText);
            }
            $(".glyphicon-refresh").hide();

            if (timer) {
                console.log("showDocs " + (Date.now() - lap) + " ms");
            }
            resize(config.showLink);
        }

    });
});
