$(document).ready(function() {
    const backendUrl = 'http://localhost:3000'; // Adjust this if deployed elsewhere

    let allData = {};
    let isDataLoaded = false;
    let allDetailsShown = false;

    function updateFeedback(message) {
        $('#feedback').html(`<p>${message}</p>`);
    }

    function fetchAllSheets() {
        updateFeedback("Fetching data from GITP - MIRA Database...");

        $.ajax({
            url: `${backendUrl}/api/sheets`,
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                const sheets = response.sheets;
                let fetchPromises = sheets.map(sheet => fetchSheet(sheet.properties.title));

                Promise.all(fetchPromises).then(() => {
                    isDataLoaded = true;
                    populateSheetSelect();
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
                url: `${backendUrl}/api/sheet/${sheetName}`,
                type: 'GET',
                dataType: 'json',
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

    function toggleAllDetails() {
        allDetailsShown = !allDetailsShown;
        const detailsText = allDetailsShown ? 'Show Less' : 'Show More';
        const toggleText = allDetailsShown ? 'Hide All Details' : 'Show All Details';

        $('.collapsible-details').slideToggle();
        $('.toggle-details').text(detailsText);
        $('#toggleAllDetails').text(toggleText);
    }

    function handleSearchInput() {
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
                filteredResults = filteredResults.concat(results.map(row => ({ sheetName, row })));
            }
        }

        displayResults(filteredResults, searchTerm);
    }

    function displayResults(results, searchTerm) {
        const $results = $('#results');
        $results.empty();

        if (results.length === 0) {
            $('#noResultsModal').css('display', 'block');
            updateFeedback(`No results found for "${searchTerm}". If you think this is a mistake, contact Admin for support.`);
            return;
        }

        $('#noResultsModal').css('display', 'none'); // Hide modal if results are found
        updateFeedback(`Found ${results.length} results for "${searchTerm}".`);

        results.forEach(({ sheetName, row }) => {
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

            const agencyLinkHtml = agencyName === 'N/A' ? 'N/A' : `<a href="${agencyLink}" target="_blank">Facebook Page</a>`;

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
            $details.slideToggle();
            $(this).text($details.is(':visible') ? 'Show Less' : 'Show More');
        });
    }

    $('#toggleAllDetails').on('click', toggleAllDetails);

    fetchAllSheets();

    $('#searchInput, #sheetSelect').on('input change', handleSearchInput);

    // Event listener for the close button in the modal
    $('.close').on('click', function() {
        $('#noResultsModal').css('display', 'none'); // Hide the modal
    });

    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
});
