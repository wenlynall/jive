(function() {
    jive.tile.onOpen(function(config, options) {
        gadgets.window.adjustHeight();

        // taken from the jquery-validation plugin and modified
        // https://github.com/jzaefferer/jquery-validation
        var urlRegex = /^(?:(?:(?:https?|ftp):)\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/;
        var httpRegex = /^https?:\/\//;

        jive.tile.getContainer(function (container) {
            var p = document.createElement("a");
            p.href = container.parent;

            // default url start
            var defaultUrlThis = container.resources.html.ref + "/content?filterID=contentstatus%5Bpublished%5D~objecttype~objecttype%5Bidea%5D";
            var defaultUrlAll = p.origin + "/content?filterID=all~objecttype~objecttype%5Bidea%5D";

            var sortUrlEndings = {
                "all": {
                    "scoreDesc": "&sortKey=all~objecttype~objecttype%5Bidea%5D~ideaScoreDesc&sortOrder=0",
                    "scoreAsc": "&sortKey=all~objecttype~objecttype%5Bidea%5D~ideaScoreAsc&sortOrder=1",
                    "votesDesc": "&sortKey=all~objecttype~objecttype%5Bidea%5D~ideaPopularityDesc&sortOrder=0",
                    "latestActivityDesc": "&sortKey=all~objecttype~objecttype%5Bidea%5D~recentActivityDateDesc&sortOrder=0",
                },
                "this": {
                    "scoreDesc": "&sortKey=contentstatus%5Bpublished%5D~objecttype~objecttype%5Bidea%5D~ideaScoreDesc&sortOrder=0",
                    "scoreAsc": "&sortKey=contentstatus%5Bpublished%5D~ideaScoreAsc&sortOrder=1&itemView=detail",
                    "votesDesc": "&sortKey=contentstatus%5Bpublished%5D~objecttype~objecttype%5Bidea%5D~ideaPopularityDesc&sortOrder=0",
                    "votesAsc": "&sortKey=contentstatus%5Bpublished%5D~ideaPopularityAsc&sortOrder=1&itemView=detail",
                    "latestActivityAsc": "&sortKey=contentstatus%5Bpublished%5D~recentActivityDateAsc&sortOrder=1&itemView=detail",
                    "latestActivityDesc": "&sortKey=contentstatus%5Bpublished%5D~objecttype~objecttype%5Bidea%5D~recentActivityDateDesc&sortOrder=0",
                    "dateCreatedAsc": "&sortKey=contentstatus%5Bpublished%5D~creationDateAsc&sortOrder=1&itemView=detail",
                    "dateCreatedDesc": "&sortKey=contentstatus%5Bpublished%5D~creationDateDesc&sortOrder=0&itemView=detail"
                }
            }
            sortUrlEndings.sub = sortUrlEndings.this;

            // make sure config has default values
            if (config.data === undefined) {
                config.data = {
                    title: "Ideas",
                    numResults: 6,
                    place: "this",
                    sort: "scoreDesc",
                    showLink: true,
                    linkText: "See More Ideas",
                    linkUrl: defaultUrlThis
                };
            };

            var title = document.getElementById("title");
            var numResults = document.getElementById("num-results");
            var radios = document.getElementsByName("place");
            var sorts = document.getElementsByName("sort");
            var showLink = document.getElementById("show-link");
            var linkText = document.getElementById("link-text");
            var linkUrl = document.getElementById("link-url");

            // populate the dialog with existing config value
            title.value = config.data.title;
            numResults.value = config.data.numResults;
            for (let choice of radios) {
                if (choice.value === config.data.place) {
                    choice.checked = true;
                    break;
                }
            }
            for (let choice of sorts) {
                if (choice.value === config.data.sort) {
                    choice.checked = true;
                    break;
                }
            }
            showLink.checked = config.data.showLink;
            $("#link-options").toggle(showLink.checked);
            linkText.value = config.data.linkText;
            linkUrl.value = config.data.linkUrl;
            gadgets.window.adjustHeight();

            function validate(data) {
                var valid = true;
                var inputs = document.getElementsByClassName("error-box");
                for (var el of inputs) {
                    el.classList.remove("error-box");
                }

                numResultsVal = Number(data.numResults.value);
                if (numResultsVal % 1 !== 0 || numResultsVal < 1 || numResultsVal > 100) {
                    // test if not positive integer between 1 and 100
                    showError(data.numResults);
                    valid = false;
                }

                if (data.showLink.checked && data.linkText.value === "") {
                    showError(data.linkText);
                    valid = false;
                }

                if (data.showLink.checked && data.linkUrl.value !== "" && !urlRegex.test(data.linkUrl.value)) {
                    showError(data.linkUrl);
                    valid = false;
                }

                return valid;
            }

            function showError(errInput) {
                errInput.classList.add("error-box");
            }

            $("#btn-submit").click( function() {
                var checkData = {
                    numResults: numResults,
                    showLink: showLink,
                    linkText: linkText,
                    linkUrl: linkUrl
                }
                if (validate(checkData)) {
                    // get all of the new values
                    config.data.title = title.value;
                    config.data.numResults = Number(numResults.value);
                    for (var choice of radios) {
                        if (choice.checked) {
                            config.data.place = choice.value;
                            break;
                        }
                    }
                    for (var choice of sorts) {
                        if (choice.checked) {
                            config.data.sort = choice.value;
                            break;
                        }
                    }
                    config.data.showLink = showLink.checked;

                    if (showLink.checked) {
                        config.data.linkText = linkText.value;
                        if (linkUrl.value !== "" && !httpRegex.test(linkUrl.value)) {
                            linkUrl.value = "http://" + linkUrl.value;
                        } else if (linkUrl.value === "") {
                            linkUrl.value = (config.data.place === "all" ? defaultUrlAll : defaultUrlThis);
                            if (config.data.sort in sortUrlEndings[config.data.place]) {
                                linkUrl.value += sortUrlEndings[config.data.place][config.data.sort];
                            }
                        }
                        config.data.linkUrl = linkUrl.value;
                    }

                    // submit
                    jive.tile.close(config, {} );
                } else {
                    gadgets.window.adjustHeight();
                }
            });
        });
    });
})();

$(document).ready(function() {
    $("#show-link").change(function() {
        $("#link-options").toggle();
        gadgets.window.adjustHeight();
    });
});
