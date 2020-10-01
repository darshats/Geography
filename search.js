// Create a div to hold the control.
function searchControl(searchDiv, map) {
    // text box
    searchDiv.style.backgroundColor = '#e0e0e0';
    
    var searchTextBoxDiv = document.createElement('div');
    searchTextBoxDiv.id = 'filter-text';
    
    var searchTextBox = document.createElement('input');
    searchTextBox.style.backgroundColor = '#777777';
    searchTextBox.style.border = '0px';
    searchTextBox.style.textAlign = 'left';
    searchTextBox.style.display = 'inline-block';
    searchTextBox.style.height = '24px';
    searchTextBox.style.padding = '15px 0 15px 20px';
    searchTextBox.style.boxSizing = 'border-box';
    searchTextBox.style.marginRight = '0';
    searchTextBox.id = 'filter-value';
    searchTextBox.placeholder = 'Search';
    searchTextBoxDiv.appendChild(searchTextBox);
    
    searchDiv.appendChild(searchTextBox);

    // search button
    var searchButton = document.createElement('button');
    searchButton.style.background = '#1f7f5c url(search.png) center no-repeat';
    searchButton.style.display = 'inline-block';
    searchButton.style.border = '0px';
    searchButton.style.height = '24px';
    searchButton.style.width = '24px';
    searchButton.style.padding = '0 0 7px 0';
    searchButton.id = 'run-filter';
    searchDiv.appendChild(searchButton);

    // search type dropdown
    var searchTypeDiv = document.createElement('div');
    searchTypeDiv.id = 'filter';
    searchTypeDiv.style.display = 'inline-block';

    var selectList = document.createElement('select');
    selectList.id = 'filter-option';
    selectList.style.backgroundColor = '#777777';
    selectList.style.border = '0px';
    selectList.style.height = '24px';
    searchTypeDiv.appendChild(selectList);

    // create the options
    var optionAName = document.createElement('option');
    optionAName.value = 'aname';
    optionAName.text = 'Area/place name';
    selectList.appendChild(optionAName);

    var optionPName = document.createElement('option');
    optionPName.value = 'pname';
    optionPName.text = 'Person name';
    selectList.appendChild(optionPName);

    var optionLName = document.createElement('option');
    optionLName.value = 'lname';
    optionLName.text = 'Literary work';
    selectList.appendChild(optionLName);

    var optionDate = document.createElement('option');
    optionDate.value = 'date';
    optionDate.text = 'Date range (yyyy-yyyy)';
    selectList.appendChild(optionDate);

    searchDiv.appendChild(searchTypeDiv);
}
