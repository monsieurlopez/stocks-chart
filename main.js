$(document).ready(function() {

  const searchResults = $('#search-results');
  let selectedSymbol = '';
  let selectedName = '';


  try { 
    /////////////////First part of the code/////////////////////////////////////////
    //The first API call is executed when the user starts using the stock browser.
    $('#search-input').on('input', async (event) => {
      const searchTerm = event.target.value;
      const apiKey = 'DV9PEFFGLTQD90K2';
      const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${searchTerm}&apikey=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      console.log(data);

      const companies = data['bestMatches'];
      const equityMatches = companies.filter(match => match['3. type'] === 'Equity');

      const equityUSA = equityMatches.filter(match => match['4. region'] === 'United States'); 

      console.log(equityUSA);

      searchResults.empty();

      equityUSA.forEach(result => {
        const symbol = result['1. symbol'];
        const name = result['2. name'];
        const li = `<li id="elementItens" class="list-group-item list-group-item-action list-group-item-primary" data-symbol="${symbol}" data-name="${name}">${symbol} - ${name}</li>`;
        searchResults.append(li);
      });

      //We handle the click event on the possible suggestions provided to the user 
      $('#search-results').on('click', 'li', (event) => {
        const value = $(event.target).text().trim();
        $('#search-input').val(value);
        $('#search-results').empty();
      });

      //We handle the click event of the browser to select the action to be displayed.
      searchResults.on('click', 'li', function() {
        selectedSymbol = $(this).data('symbol');
        selectedName = $(this).data('name');
        console.log(selectedSymbol);
      }); 
    });

  } catch (error) {
    console.error(error);
  }  

/////////////////Second part of the code/////////////////////////////////////////
//API requests: in this part of the code we make the second API call

//This call is executed when we click to search
$('#selectedStock').on('click', async () => {
  //We run the function again to update the new data and display it in the graphic
 
  
  try {

    const apiKey = 'DV9PEFFGLTQD90K2';
    const API = (`https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=${selectedSymbol}&apikey=${apiKey}`);
    const response = await fetch (API);
    const data = await response.json();
    console.log(data);

     function getSelectedStock() {
      return selectedSymbol;
    };
    function AddStockSelected(selectedName) {
      $("#ShowStockSelected").toggleClass("d-none d-block");

      const closeButton = '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
      const newDiv = '<div class="alert alert-dismissible fade show" role="alert"><span>' + selectedName + '</span>' + closeButton + '</div>';

      $('#ShowStockSelected').append(newDiv);
    }
    getSelectedStock();
    AddStockSelected(selectedName);
    window.myLine.resetZoom();
    window.myLine.update();

    const companyName = data['Meta Data']['2. Symbol'];
    const monthlyData = data['Monthly Adjusted Time Series'];

    //We create a new array with the constants we need
    const lastDate = Object.keys(data['Monthly Adjusted Time Series'])[0];
    const lastData = data['Monthly Adjusted Time Series'][lastDate];

    const lastPrice = [{    
      year: lastDate.split("-")[0],
      closePrice: lastData['4. close'],
    }];

    const decemberData = Object.entries(monthlyData)
      .filter(([key, value]) => {
        const date = new Date(key);
        return date.getMonth() === 11;
      })
      .map(([key, value]) => {
        const year = key.slice(0, 4);
        const closePrice = value['4. close'];
        return { year, closePrice };
      });
    //We add the last price to our array:
    decemberData.unshift(lastPrice[0]);
    
    config.data.labels = decemberData.map(d => d.year);
    config.data.datasets[0].data = decemberData.map(d => d.closePrice);
    config.data.datasets[0].label = companyName;
    
    window.myLine.update();

    //We automatically add the limits according to the maximum values of each action:
    config.options.plugins.zoom.zoom.limits.y.max = Math.max(...decemberData.map(d => d.closePrice)) + 5;
    config.options.plugins.zoom.zoom.limits.x.max = Math.max(...decemberData.map(d => d.year)) + 2;

  } catch (error) {
    console.log(error);
  }
  
});

  /***********************************************************************/
  $(document).on('click', '.btn-close', function() {
    $('#search-input').val('');
    console.log("Boton cierre");

    // Destroy existing chart instance and create a new one with empty data

    function removeData(chart) {
      chart.data.labels = [];
      chart.data.datasets.label = [];
      chart.data.datasets.forEach((dataset) => {
        dataset.data = [];
      });
      chart.update();
    }
    
  removeData(myLine); 
  window.myLine.update();

  });

  $("#resetZoom").click(function() {
    window.myLine.resetZoom();
  });

  $('#modeZoom').on('change', function() {
    var isChecked = $(this).is(':checked');

    if (isChecked) {
      window.myLine.config.options.plugins.zoom = { 
        zoom: {
          limits: {
            x: {min: 10, max: 100, minRange: 50},
            y: {min: 0, max: 100, minRange: 50},
          },
          wheel: {
            enabled: true
          },
          drag:{
            enabled: true,
            
          },
          pinch: {
            enabled: true
          },
          mode: "xy"
        },
        pan: {
          enabled: true,
          mode: 'xy',
          modifierKey: 'shift',
        }
      } 

    } else {
      
      window.myLine.config.options.plugins.zoom = { 
        disabled: true, }
    }  
    window.myLine.update();
  });

  function randomColorFactor() {
    return Math.round(Math.random() * 255);
  }

  function randomColor(opacity) {
    return (
      "rgba(" +
      randomColorFactor() +
      "," +
      randomColorFactor() +
      "," +
      randomColorFactor() +
      "," +
      (opacity || ".3") +
      ")"
    );
  }

  var config = {
    type: 'line',
    data: {
      labels: [""], //The dates
      datasets: [{
        label: [""],
        data: [""], //The closing prices
        borderColor: 'rgb(75, 192, 192)',
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'year'
          },
          title: {
            display: true,
            text: 'Years'
          },
        },
        y: {
          title: {
            display: true,
            text: 'Closing prices'
          }
        },
      },
      plugins: {
        zoom: {
          zoom: {
            limits: {
              x: {min: 10, max: 100, minRange: 50},
              y: {min: 0, max: 100, minRange: 50},
            },
            wheel: {
              enabled: true
            },
            drag:{
              enabled: true,
              
            },
            pinch: {
              enabled: true
            },
            mode: "xy"
          },
          pan: {
            enabled: true,
            mode: 'xy',
            modifierKey: 'shift',
          }
        }, 
      }
    }
  };

  config.data.datasets.forEach(function (dataset) {
    dataset.borderColor = randomColor(0.4);
    dataset.backgroundColor = randomColor(0.5);
    dataset.pointBorderColor = randomColor(0.7);
    dataset.pointBackgroundColor = randomColor(0.5);
    dataset.pointBorderWidth = 2;
  });

  $(function() {
    var ctx = $("#canvas");
    window.myLine = new Chart(ctx, config);
  });


});




