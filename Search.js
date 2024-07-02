$(document).ready(function() {
    const sheetId = '1CTvPjCQNQCWrO4CSNVz9MByPJjTukJlKbzJm_yvDn_A';
    const apiKey = 'AIzaSyAdE12Lpp9dY6vhYJX6OTos8oXi-sV8Uxo';

    let allData = {};
    let isDataLoaded = false;

    function updateFeedback(message) {
        $('#feedback').html(`<p>${message}</p>`);
    }

    function fetchAllSheets() {
        updateFeedback("Fetching data from GITP - MIRA Database...");

        $.ajax({
            url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
            type: 'GET',
            dataType: 'json',
            data: { key: apiKey },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            success: function(response) {
                const sheets = response.sheets;
                let fetchPromises = [];

                sheets.forEach(sheet => {
                    const sheetName = sheet.properties.title;
                    fetchPromises.push(fetchSheet(sheetName));
                });

                Promise.all(fetchPromises).then(() => {
                    isDataLoaded = true;
                    populateSheetSelect(); // Populate the select dropdown
                    updateFeedback("Data updated. You can now search for staff name.");
                });
            },
            error: function(jqXHR, textStatus, errorThrown) {
                updateFeedback(`Traffic ${textStatus}. Please try again after 10 seconds.`);
                console.error("Error details:", errorThrown);
            }
        });
    }

    function fetchSheet(sheetName) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}`,
                type: 'GET',
                dataType: 'json',
                data: { key: apiKey },
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                success: function(response) {
                    allData[sheetName] = response.values;
                    resolve();
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error(`Error fetching ${sheetName}:`, errorThrown);
                    reject(errorThrown);
                }
            });
        });
    }

    function populateSheetSelect() {
        const $sheetSelect = $('#sheetSelect');
        $sheetSelect.empty().append('<option value="">All Staff</option>');

        Object.keys(allData).forEach(sheetName => {
            $sheetSelect.append(`<option value="${sheetName}">${sheetName}</option>`);
        });
    }

    let allDetailsShown = false;

    function toggleAllDetails() {
        allDetailsShown = !allDetailsShown;
        if (allDetailsShown) {
            $('.collapsible-details').slideDown();
            $('.toggle-details').text('Show Less');
            $('#toggleAllDetails').text('Hide All Details');
        } else {
            $('.collapsible-details').slideUp();
            $('.toggle-details').text('Show More');
            $('#toggleAllDetails').text('Show All Details');
        }
    }

    $('#toggleAllDetails').on('click', toggleAllDetails);

    document.querySelector('.toggle-all-details').addEventListener('click', function() {
        this.classList.toggle('clicked');
    });

    fetchAllSheets();

    $('#searchInput, #sheetSelect').on('input change', function() {
        const searchTerm = $('#searchInput').val().toLowerCase();
        const selectedSheet = $('#sheetSelect').val();

        if (!isDataLoaded) {
            updateFeedback("Verifying. Please wait...");
            return;
        }

        updateFeedback("Searching...");

        let filteredResults = [];

        for (let sheetName in allData) {
            if (allData.hasOwnProperty(sheetName) && (selectedSheet === '' || sheetName === selectedSheet)) {
                const results = allData[sheetName].filter((row, index) =>
                    index > 0 && row[0] && row[0].toLowerCase().includes(searchTerm)
                );
                filteredResults = filteredResults.concat(results.map(row => ({sheetName, row})));
            }
        }

        displayResults(filteredResults, searchTerm);
    });

    function displayResults(results, searchTerm) {
        const $results = $('#results');
        $results.empty();

        if (results.length === 0) {
            $('#noResultsModal').css('display', 'block');
            updateFeedback(`No results found for "${searchTerm}". Please exercise caution, as this person might be a possible fraud.`);
            return;
        } else {
            $('#noResultsModal').css('display', 'none'); // Hide modal if results are found
            updateFeedback(`Found ${results.length} results for "${searchTerm}".`);
            
            results.forEach(({sheetName, row}) => {
                const name = row[0] || 'N/A';
                const position = row[1] || 'N/A';
                const status = row[2] || 'N/A';
                const facebook = row[3] || '#';
                const agencyName = row[4] || 'N/A';
                const agencyLink = row[5] || '#';
                const notes = row[6] || 'No notes available';
                const verifiedBy = row[7] || 'N/A';

                const statusClass = status.toLowerCase() === 'active' ? 'status-active' :
                                    status.toLowerCase() === 'expired' ? 'status-expired' : 'status-revoked';

                let agencyLinkHtml;
                if (agencyName === 'N/A') {
                    agencyLinkHtml = 'N/A';
                } else {
                    agencyLinkHtml = `<a href="${agencyLink}" target="_blank">Facebook Page</a>`;
                }

                const resultItem = `
                    <div class="result-item">
                        <h3>${name}</h3>
                        <p><span class="label">Position:</span> ${position}</p>
                        <p><span class="label">Status:</span> <span class="status ${statusClass}">${status}</span></p>
                        <p><span class="label">Facebook:</span> <a href="${facebook}" target="_blank">Profile</a></p>
                        <button class="toggle-details">${allDetailsShown ? 'Show Less' : 'Show More'}</button>
                        <div class="collapsible-details" style="display: ${allDetailsShown ? 'block' : 'none'};">
                            <p><span class="label">Agency:</span> ${agencyName}</p>
                            <p><span class="label">Agency Link:</span> ${agencyLinkHtml}</p>
                            <p><span class="label">Notes:</span> ${notes}</p>
                            <p><span class="label">Verified By:</span> ${verifiedBy}</p>
                        </div>
                    </div>
                `;

                $results.append(resultItem);
            });

            // Attach the click event to the dynamically created .toggle-details buttons
            $('.toggle-details').off('click').on('click', function() {
                const $details = $(this).next('.collapsible-details');
                if ($details.is(':visible')) {
                    $details.slideUp();
                    $(this).text('Show More');
                } else {
                    $details.slideDown();
                    $(this).text('Show Less');
                }
            });
        }
    }

    // Event listener for the close button in the modal
    $('.close').on('click', function() {
        $('#noResultsModal').css('display', 'none'); // Hide the modal
    });

    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
});
