$(() => {
  // constants
  const api = "https://api.coingecko.com/api/v3/coins/list";
  const apiInfo = "https://api.coingecko.com/api/v3/coins/";
  const favCoinArrKey = "favCoinArr";
  const cacheKey = "coinInfoData";
  const currentPageKey = "currentPage";
  // variables
  let coinsInfoData;
  let coinsData = JSON.parse(localStorage.getItem("coinPageData")) || [];
  let startIndex = 0;
  let resultLimit = 101;
  let currentPage = localStorage.getItem(currentPageKey) || "homePage";
  let favCoinArr = JSON.parse(localStorage.getItem(favCoinArrKey)) || [];
  let snackbarShown = false; 
  //==============DATA FUNCTIONS============//
  const fetchData = (api, coinId, dataType) => {
    $(".progress").show();
    // Check cache
    const cachedData = localStorage.getItem(`${cacheKey}_${coinId}`);
    if (cachedData) {
      const currentTime = new Date().getTime();
      const lastFetchedTime = localStorage.getItem(`lastFetchedTime_${coinId}`);
      // Check if the cached data is more than 2 seconds old
      if (lastFetchedTime && currentTime - lastFetchedTime <= 120000) {
        handleData(JSON.parse(cachedData), dataType);
        $(".progress").hide();
        return;
      }
    }
    $.get(api, (data) => {
      //datatype-in case more info
      if (dataType == "apiCoinInfo") {
        localStorage.setItem(`${cacheKey}_${coinId}`, JSON.stringify(data));
        localStorage.setItem(`lastFetchedTime_${coinId}`, new Date().getTime());
      }
      handleData(data, dataType);
      $(".progress").hide();
    }).fail((xhr, status, error) => {
      console.error(`Error fetching data from ${api}: ${error}`);
      // Handle the error gracefully, e.g., show an error message to the user
      showSnackbar("Failed to fetch data. Please try again later.");
      $(".progress").hide();
    });
  };
  const handleData = (data, dataType) => {
    if (dataType == "apiCoinInfo") {
      coinsInfoData = data;
      displayCoinInfo(coinsInfoData);
      return;
    } else {
      localStorage.setItem("coinPageData", JSON.stringify(data));
      displayCoins(data);
    }
  };
  //================EVENT LISTENERS===============//
  $(".nav-link").on("click", (event) => {
    let targetPage = event.target.attributes.id.nodeValue;
    navNavigate(targetPage);
  });
  $(".searchBtn").on("click", (event) => {
    event.preventDefault(); // Prevent the default action
    snackbarShown = false; // Flag to track whether the snackbar has been shown
    const userSearch = $(".searchInput").val();
    if (userSearch == "") {
      showSnackbar("can not search empty text", 3000);
      return;
    } else {
      userCoinSearch(coinsData, userSearch);
    }
  });
  $(document).on("click", ".moreInfoBtn", (e) => {
    let coinClick = e.target.classList[3];
    //CHECK IF FLAG ALREADY EXIST
    if (!$(e.target).data("fetched")) {
      fetchData(apiInfo + coinClick, coinClick, "apiCoinInfo");
      //SETTING FLAG
      $(e.target).data("fetched", true);
    }
  });
  $(document).on("click", ".loadMoreBtn", () => {
    startIndex += resultLimit;
    displayCoins(coinsData);
  });
  $(document).on("click", ".switchBtn", (e) => {
    const coinId = e.target.id;
    const isChecked = e.target.checked;
    //check switch state
    if (isChecked) {
      //true
      favoriteSwitchLimit(coinId);
    } else {
      removeCoin(coinId);
    }
  });
  $(document).on("click", ".delete-button", (e) => {
    const $trToRemove = $(e.target).closest("tr"); // Find the closest <tr> element to the delete button clicked
    const coinID = $trToRemove.find("td:first").text();
    if (coinID) {
      removeCoin(coinID);
    }
    // Remove the <tr> from the modal
    $trToRemove.remove();
  });
  $(".btn-close").on("click", (e) => {
    // Close the modal without taking any further action
    $("#myModal").modal("hide");
    switchUpdate();
  });
  $(document).on("click", ".modalSaveBtn", (e) => {
    // Check if including the sixth coin, exceeds 5
    if (favCoinArr.length >= 5) {
      $("#errorElert").show();

      // Prevent the modal from closing
      closeModalCheckSaveBtn(e);
      return;
    } else if (favCoinArr.length < 5) {
      // Add the sixth coin from the modal if there's space
      addSixthCoinFromModal();
    }
    switchUpdate();
    $("#myModal").modal("hide");
  });
  //===============================//
  const navNavigate = (targetPage) => {
    $(".progress").hide();
    // Update the current page&tab
    currentPage = targetPage;
    localStorage.setItem(currentPageKey, targetPage);
    $(".nav-link").removeClass("active");
    $(`#${targetPage}`).addClass("active");
    $(".contentBox").empty();

    // Load content based on the targetPage
    switch (targetPage) {
      case "homePage":
        startIndex = 0;
        fetchData(api, targetPage);
        break;
      case "live-reports":
        // Load content for the Live Reports section
        const chartContainer = document.createElement("div");
        chartContainer.id = "chartContainer";
        $(".contentBox").append(chartContainer);
        displayReports();
        break;
      case "aboutMe":
        displayAbout();
        break;
      default:
        startIndex = 0;
        displayCoins(coinsData);
    }
  };
  function showSnackbar(message, duration = 3000) {
    const snackbar = document.getElementById("snackbar");
    if (!snackbar || snackbarShown) return;

    snackbar.textContent = message;
    snackbar.classList.add("show");
    snackbarShown = true; // Update the flag to indicate that the snackbar has been shown

    setTimeout(() => {
      snackbar.classList.remove("show");
    }, duration);
  }

  //=============home==================//
  const displayCoins = (coins) => {
    const contentContainer = $(".contentBox");
    let rowHtml = contentContainer.html();
    if (!rowHtml.includes("<div class='row'>")) {
      // Add the row container if it's missing
      rowHtml += "<div class='row'>";
    } // Track the number of displayed and skipped coins
    let displayedCoins = 0;
    let skippedCoins = 0;
    for (let i = startIndex; i < coins.length; i++) {
      const coin = coins[i]; //remove non relevent coins
      if (/\d/.test(coin.name) || coin.symbol.length > 4) {
        skippedCoins++;
        continue;
      }
      rowHtml += `  <div class="col-sm-4 coinBox">
      <div class="row">
        <div class="col-sm-6">
            <div class=" textDiv">
                      <h3 class="item">${coin.symbol}</h3>
                      <p class="item">${coin.name}</p>
                    <button type="button" 
                    class=" btn btn-primary btn-sm ${coin.id} moreInfoBtn"
                    data-bs-toggle="collapse" data-bs-target="#div${coin.id}">
                    More Info
                    </button> 
              </div>
        </div>      
        <div class="col-sm-6 checkbox switch checkDiv">
          <div class="form-check form-switch">
            <input class="input-lg form-check-input switch-input switchBtn"
              type="checkbox" id="${coin.id}" />
          </div>
        </div>
      </div>
      <div id="div${coin.id}" class="card collapse coinInfoDiv"></div>
    </div>`;
      displayedCoins++;
      if (displayedCoins > resultLimit) {
        break;
      }
    }
    rowHtml += `</div>
    `;
    contentContainer.html(rowHtml);
    // Update startIndex for the next batch of coins
    startIndex += displayedCoins + skippedCoins;
    if (currentPage === "homePage" && startIndex < coins.length) {
      addLoadMoreButton(currentPage);
    } else if ($(".loadMoreBtn").length > 0 && startIndex >= coins.length) {
      $(".loadMoreBtn").remove();
    }
    switchUpdate();
  };
  const addLoadMoreButton = (currentPage) => {
    $(".loadMoreBtn").remove();

    //    <div class="container-fluid loadDiv"></div>
    const loadBtnContainer = document.createElement("div");
    loadBtnContainer.className = "container-fluid loadDiv";
    const loadBtnHTML = `<button type="button" 
    class="loadMoreBtn btn  btn-sm">Load More</button>`;
    if (currentPage === "homePage") {
      // Append the load more button to the loadBtnContainer
      loadBtnContainer.innerHTML = loadBtnHTML;
      // Append the loadBtnContainer to the appropriate parent element
      $(".contentBox").append(loadBtnContainer);
    }
  };
  const displayCoinInfo = (coin) => {
    let coinUSD = parseFloat(coin.market_data.current_price.usd).toFixed(6);
    let coinEUR = parseFloat(coin.market_data.current_price.eur).toFixed(6);
    let coinILS = parseFloat(coin.market_data.current_price.ils).toFixed(6);
    
    
    
    const coinContainer = $(`#div${coin.id}`);
    const coinInfoHtml = `
    <div class="card-body coinText">
    <img class="card-img-top" id="coinImg" src="${coin.image.large}" />
      <hr/>
      <h5> ${coin.name}</h5>
        <p>PRICES:
        <br>
        ${coinUSD} $ 
        <br>
        ${coinEUR} €
        <br>
        ${coinILS} ₪
        </p>
    </div> 
    `;
    coinContainer.html(coinInfoHtml);
  };
  const userCoinSearch = (coins, userSearch) => {
    $(".progress").show();
    startIndex = 0;
    const searchResults = coins.filter((coin) => {
      return (
        coin.id.toLowerCase().includes(userSearch.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(userSearch.toLowerCase()) ||
        coin.name.toLowerCase().includes(userSearch.toLowerCase())
      );
    });
    if (searchResults.length > 0) {
      $(".contentBox").empty();
      $(".loadDiv").empty();
      displayCoins(searchResults);
    } else {
      showSnackbar("Coin was not found, please try again", 3000);
    }
    $(".progress").hide();
  };
  const favoriteSwitchLimit = (coinId) => {
    if (favCoinArr.length <= 4) {
      const existingCoinIndex = favCoinArr.findIndex(
        (coin) => coin.id === coinId
      );
      if (existingCoinIndex === -1) {
        // If the coin doesn't exist, find it in coinsData and push it to favCoinArr
        const coinToAdd = coinsData.find((coin) => coin.id === coinId);
        if (coinToAdd) {
          favCoinArr.push(coinToAdd);
          localStorage.setItem(favCoinArrKey, JSON.stringify(favCoinArr));
        }
      }
    } else {
      favModalHandle(coinId);
      return;
    }
  };
  const favModalHandle = (sixthCoinId) => {
    // Clear the modal content
    $(".modalCoinTable").html("");
    // Display the sixth coin if it exists
    if (sixthCoinId) {
      displaySixthCoin(sixthCoinId);
    }
    //  HTML for each  coin
    let modalHtml = ` 
      <tr>
        <th>Coin ID</th>
        <th>Coin Symbol</th>
        <th>Coin Name</th>
        <th>Remove</th>
      </tr>
  `;
    favCoinArr.forEach((coin) => {
      modalHtml += ` 
     <tr>
         <td>${coin.id}</td>
         <td>${coin.symbol}</td>
         <td>${coin.name}</td>
         <td><button class=" delete-button ${coin.id}">
         <i class="fa fa-window-close"></i></button></td>
     </tr>`;
    });
    // Append the generated HTML to the modal coin table
    $(".modalCoinTable").append(modalHtml);
    // Trigger the modal to show
    $("#errorElert").hide();

    $("#myModal").modal("show");
  };
  const closeModalCheckSaveBtn = (e) => {
    // Prevent the modal from being hidden
    e.preventDefault();
    e.stopImmediatePropagation();

    //show elert text
    $("#myModal").modal("show");
  };
  const displaySixthCoin = (sixthCoinId) => {
    $(".lastCoinTable").html("");
    const coin = coinsData.find((coin) => coin.id === sixthCoinId);
    let lastCoinHtml = "";
    if (coin) {
      lastCoinHtml += ` 
            <tr>
                <td>${coin.id}</td>
                <td>${coin.symbol}</td>
                <td>${coin.name}</td>
            </tr>`;
    }
    $(".lastCoinTable").append(lastCoinHtml);
  };
  const removeCoin = (coinID) => {
    const coinIndex = favCoinArr.findIndex((coin) => coin.id === coinID);
    // Remove the coin if found
    if (coinIndex !== -1) {
      favCoinArr.splice(coinIndex, 1);
      localStorage.setItem(favCoinArrKey, JSON.stringify(favCoinArr));
    }
    $("#errorElert").hide();
  };
  const addSixthCoinFromModal = () => {
    const lastCoinHtml = $(".lastCoinTable").html();
    // Extract the coin id from the HTML content
    const sixthCoinId = $(lastCoinHtml).find("td:first").text();
    if (sixthCoinId) {
      coinsData.forEach((coin) => {
        if (coin.id == sixthCoinId) {
          favCoinArr.push(coin);
          localStorage.setItem(favCoinArrKey, JSON.stringify(favCoinArr));
        }
      });
    }
  };
  function switchUpdate() {
    $(`.switchBtn`).prop("checked", false);
    favCoinArr.forEach((coin, index) => {
      const coinId = coin.id;
      const switchElement = $(`#${coin.id}`);
      const switchElementID = switchElement.attr("id");
      if (coinId == switchElementID) {
        // Turn on the switch associated with the coin
        switchElement.prop("checked", true);
      }
    });
  }
  //===================Live Reports===================//
  class CryptocurrencyChart {
    constructor(coins) {
      this.coins = coins;
      this.dataPoints = coins.map(() => []);
      this.chart = null;
      this.updateInterval = 2000;
    }
    initChart() {
      const options = {
        title: {
          text: "Cryptocurrency Prices",
        },
        axisX: {
          title: "chart updates every 2 secs",
        },
        axisY: {
          title: "Price (USD)",
        },
        toolTip: {
          shared: true,
        },
        legend: {
          cursor: "pointer",
          verticalAlign: "top",
          fontSize: 22,
          fontColor: "dimGrey",
          itemclick: this.toggleDataSeries.bind(this),
        },
        data: this.coins.map((coin, index) => ({
          type: "line",
          xValueType: "dateTime",
          yValueFormatString: "###.00",
          xValueFormatString: "hh:mm:ss TT",
          showInLegend: true,
          name: coin,
          dataPoints: this.dataPoints[index],
        })),
      };
      this.chart = new CanvasJS.Chart("chartContainer", options);
      this.chart.render();
    }
    toggleDataSeries(e) {
      if (typeof e.dataSeries.visible === "undefined" || e.dataSeries.visible) {
        e.dataSeries.visible = false;
      } else {
        e.dataSeries.visible = true;
      }
      e.chart.render();
    }
    updateChart(count) {
      if (currentPage !== "live-reports") {
        // If the current page is not "live-reports", stop updating chart
        return;
      }
      count = count || 1;
      const startTime = new Date();
      startTime.setSeconds(
        startTime.getSeconds() - (count * this.updateInterval) / 1000
      );
      $.get(
        "https://min-api.cryptocompare.com/data/pricemulti?fsyms=" +
          this.coins.join(",") +
          "&tsyms=USD",
        (data) => {
          if (data.Response === "Error") {
            // Handle the error
            setTimeout(() => {
              showSnackbar("Error: " + data.Message, 3000);
            }, 1000);
          }
          const minPrice = Math.min(
            ...this.coins.map((coin) => data[coin]?.USD || 0)
          );
          this.coins.forEach((coin, index) => {
            // If USD exists otherwise use 0
            const price = data[coin]?.USD || 0;
            for (let i = 0; i < count; i++) {
              const currentTime = new Date(
                startTime.getTime() + i * this.updateInterval
              );
              this.dataPoints[index].push({
                x: currentTime.getTime(),
                y: price - minPrice,
              });
            }
          });
          this.chart.render();
        }
      );
    }
    startUpdating() {
      this.updateChart(1);
      setInterval(() => {
        this.updateChart();
      }, this.updateInterval);
    }
  }
  const displayReports = () => {
    const coins = favCoinArr.map((coin) => coin.symbol.toUpperCase());
    const chart = new CryptocurrencyChart(coins);
    snackbarShown = false;
    chart.initChart();
    chart.startUpdating();
  };
  //===================About===================//
  const displayAbout = () => {
    const aboutHtml = `
    <div class="aboutContent">
    <div class="page-header">
      <div class="container">
        <div class="row headerRow">
          <div class="col-md-3 imgDiv">
            <img
              id="meImg"
              class="img-responsive"
              src="./img/yarden-picture.jpg"
              alt="yarden-picture"
            />
          </div>
          <div class="col-md-6 aboutTextDiv">
            <div class="textAbout">
              <div class="full-name">
                <span class="first-name">Yarden</span>
                <span class="last-name">Dickshtein</span>
              </div>
              <div class="contact-info">
                <span class="email">Email: </span>
                <span class="email-val">yarden9798@gmail.com</span>
                <span class="separator"></span>
                <span class="phone">Phone: </span>
                <span class="phone-val">050-4212182</span>
                <span class="separator"></span>
                <span class="address">Address:</span>
                <span class="address-val">Haifa Israel</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <br /><br />
    <div class="container">
      <div class="conteiner">
        <h2>About Me</h2>
        <div class="about">
          As a Junior Full Stack Developer, I bring enthusiasm and dedication
          to every project I undertake. With a strong foundation in
          JavaScript, TypeScript, React, Jquery HTML, and CSS, I'm equipped to
          tackle challenges across the entire development stack.
          <br />
          I thrive in collaborative settings, where I can leverage my
          communication skills to work effectively with cross-functional
          teams.
          <br />
          <br />
          Driven by a passion for learning, I am constantly expanding my
          knowledge base and staying abreast of the latest industry trends and
          technologies.
          <br />
          My proactive approach to problem-solving and attention to detail
          ensure that I deliver solutions that meet both technical
          requirements and user expectations.
          <br />
          <br />
          I am eager to contribute to innovative projects and make meaningful
          contributions to the success of your team. With a commitment to
          continuous improvement and a growth mindset, I am ready to take on
          new challenges and drive impactful results as part of your
          development team.
        </div>
      </div>
      <br /><br />
      <div class="row">
        <div class="container education col">
          <h2>Education</h2>
          <table class="education-table aboutTables">
            <tr>
              <th>Qualification</th>
              <th>Institution</th>
              <th>Year</th>
            </tr>
            <tr>
              <td>high school</td>
              <td>ben zvi</td>
              <td>12years</td>
            </tr>
            <tr>
              <td>College</td>
              <td>John Bryce</td>
              <td>2023</td>
            </tr>
          </table>
        </div>
        <div class="container experience col">
          <h2>Experience</h2>
          <p>
            <strong>Job Title:</strong> Your Job Title<br />
            <strong>Organization:</strong> Company Name<br />
            <strong>Duration:</strong> MM/YYYY - MM/YYYY<br />
            <strong>Description:</strong> Describe your responsibilities and
            achievements in this role.
          </p>
        </div>
      </div>
    </div>
    <div class="container skills">
      <h2>Skills</h2>
      <ul class="list-unstyled">
        <li>HTML</li>
        <div class="progress">
          <div
            class="progress-bar progress-bar-striped progress-bar-animated bg-seccess"
            style="width: 95%"
          >
            95%
          </div>
        </div>
        <li>CSS | SASS</li>
        <div class="progress">
          <div
            class="progress-bar progress-bar-striped progress-bar-animated bg-seccess"
            style="width: 95%"
          >
            95%
          </div>
        </div>
        <li>Bootstrap</li>
        <div class="progress">
          <div
            class="progress-bar progress-bar-striped progress-bar-animated bg-seccess"
            style="width: 90%"
          >
            90%
          </div>
        </div>
        <li>JavaScript</li>
        <div class="progress">
          <div
            class="progress-bar progress-bar-striped progress-bar-animated bg-seccess"
            style="width: 80%"
          >
            80%
          </div>
        </div>
        <li>TypeScript</li>
        <div class="progress">
          <div
            class="progress-bar progress-bar-striped progress-bar-animated bg-seccess"
            style="width: 80%"
          >
            80%
          </div>
        </div>
        <li>Jquery</li>
        <div class="progress">
          <div
            class="progress-bar progress-bar-striped progress-bar-animated bg-seccess"
            style="width: 70%"
          >
            70%
          </div>
        </div>
        <li>React</li>
        <div class="progress">
          <div
            class="progress-bar progress-bar-striped progress-bar-animated bg-seccess"
            style="width: 50%"
          >
            50%
          </div>
        </div>
      </ul>
    </div>
    <div class="container languges">
      <h2>Languges</h2>
      <ul class="list-unstyled">
        <li>English</li>
        <div class="progress">
          <div class="progress-bar bg-info" style="width: 100%"></div>
        </div>
        <li>Hebrew</li>
        <div class="progress">
          <div class="progress-bar bg-info" style="width: 100%"></div>
        </div>
      </ul>
    </div>
    <div class="quote container">
      <h1 class="my-quote">"ביחד <span class="win">ננצח</span>"</h1>
    </div>
    <br/>
  </div>
`;
    $(".contentBox").append(aboutHtml);
  };
  navNavigate(currentPage);
});