$(document).ready(function () {
  console.dir(ccpwgl_int);

  var $canvas = $("#mainCanvas");
  ccpwgl.initialize($canvas[0], demos.options);

  camera = ccpwgl.createCamera($canvas[0], undefined, true);
  scene = ccpwgl.loadScene("res:/dx9/scene/universe/m10_cube.red");

  if (demos.options.postprocess) ccpwgl.enablePostprocessing(true);

  function loadDna(dna) {
    ccpwgl.getSofHullConstructor(dna, function (constructor) {
      if (constructor) {
        try {
          scene.removeObject(0);
        } catch (e) {}
        ship = scene[constructor](dna);
        if ("setBoosterStrength" in ship) {
          ship.setBoosterStrength($("#booster-intensity").val() / 50);
        }
        
        // Move the camera to view the ship's kill marks
        var boundingSphere = ship.getBoundingSphere();
        if (boundingSphere) {
          var center = boundingSphere.center;
          var radius = boundingSphere.radius;

          // Calculate the camera distance based on the ship's size
          var cameraDistance = radius * 2.5;

          // Update camera position and target
          camera.setPosition(center.x, center.y - cameraDistance, center.z);
          camera.setTarget(center.x, center.y, center.z);
        }
      }
    });
  }

  softree($(".sof-tree"), $("#dna"), loadDna);

  $("#create").click(function () {
    var dna = $("#dna").val();
    loadDna(dna);
    history.pushState({ dna: dna }, "SOF " + dna);
  });

  $("#normal").click(function () {
    scene.getObject(0).setSiegeState(ccpwgl.ShipSiegeState.NORMAL);
  });

  $("#siege").click(function () {
    scene.getObject(0).setSiegeState(ccpwgl.ShipSiegeState.SIEGE);
  });

  $("#booster-intensity").change(function () {
    scene.getObject(0).setBoosterStrength($(this).val() / 50);
  });

  $("#kills").change(function () {
    scene.getObject(0).setKillCount(parseInt($(this).val()));
  });

 
