//===== FLASH cards
function flashFirmware(e) {
  e.preventDefault();
  var fw_data = document.getElementById('fw-file').files[0];

  hideSpinnerShow("#fw", "spinner", "form");
  showNotification("Firmware is being updated ...");

  ajaxReq("POST", "/flash/upload", function (resp) {
    ajaxReq("GET", "/flash/reboot", function (resp) {
      showNotification(
        "Firmware has been successfully updated!");
      setTimeout(function () {
        window.location.reload();
      }, 4000);

      hideSpinnerShow("#fw", "spinner", "form");
    });
  }, null, fw_data);
}

function fetchFlash() {
  ajaxReq("GET", "/flash/next", function (resp) {
    $("#fw-slot").innerHTML = resp;
    hideSpinnerShow("#fw", "spinner", "form");
  });
  ajaxJson("GET", "/menu", function (data) {
    var v = $("#current-fw");
    if (v !== null) {
      v.innerHTML = data.version;
    }
  });
}