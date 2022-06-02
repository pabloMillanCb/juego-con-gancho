
// Clases de la biblioteca

import * as THREE from './libs/three.module.js'
import { OrbitControls } from './libs/OrbitControls.js'
import { GLTFLoader } from './libs/GLTFLoader.js'
import * as PHY from './libs/physi.esm.js'
import { CSS2DRenderer, CSS2DObject } from './libs/CSS2DRenderer.js';


// Clases de mi proyecto

import { Player } from './player.js'
import { Collectable } from './collectable.js'
import { Cohete } from './cohete.js'
import {Level} from './level.js'


class MyPhysiScene extends PHY.Scene {
  constructor (myCanvas,my2DCanvas) {
    
    // El gestor de hebras
    PHY.scripts.worker = './libs/physijs_worker.js'
    // El motor de física de bajo nivel, en el cual se apoya Physijs
    PHY.scripts.ammo   = './ammo.js'
    
    // Las dos líneas anteriores DEBEN ejecutarse antes de inicializar Physijs.Scene. En este caso, antes de llamar a super
    super();
    
    // Lo primero, crear el visualizador, pasándole el lienzo sobre el que realizar los renderizados.
    this.createRenderer(myCanvas);
    this.createLabelRenderer(my2DCanvas);
    // Se establece el valor de la gravedad, negativo, los objetos caen hacia abajo
    this.setGravity (new THREE.Vector3 (0, -20, 0));

    this.premios = []
    this.premios_update = []
    this.premios_hud = []
    this.hook=false;
    this.line=new THREE.Line(new  THREE.BufferGeometry(), new THREE.LineBasicMaterial({color:0xffffff}));
    this.line.visible=false;
    this.add(this.line);
    this.menu=true;

    //Se crea el nivel
    this.level = new Level();
    this.suelos = this.level.getSuelos();

    for (var i=0; i < this.suelos.length; i++){
      this.add(this.suelos[i]);
    }
    
    // Se crean y añaden luces a la escena
    this.createLights ();
    
    // Creamos la camara
    this.createCamera ();
    this.createCameraMenu ();

    // Creamos el audio
    this.createAudio();
      
    // Inicializamos la clase del jugador
    this.createPlayer(); 
  
    //Losta de teclas siendo pulsadas en cada frame
    this.key_pressed = {};

    //Creamos los coleccionables
    this.createPrizes();
    
    // Medida del tiempo
    this.clock = new THREE.Clock();

    //Creamos el raycaster del coleccionable
    this.createRaycaster();

    this.createSkybox();

    // Variable para comprobar si se está moviendo la camara
    this.moving_camera = false;

    // Contador para los trofeos recogidos
    this.pickup_count = 0;

    this.createHUD();
    this.cohete=new Cohete(this);
    this.add(this.cohete);
  }

  createPrizes(){

    var p = new Collectable(2, this.pickup);
    p.move(0, 0, 80);
    this.premios.push(p.getHitbox());
    this.premios_update.push(p);
    this.add (p.getObj());
    this.add (p.getHitbox());

    var p = new Collectable(2, this.pickup);
    p.move(0, 0, -115);
    this.premios.push(p.getHitbox());
    this.premios_update.push(p);
    this.add (p.getObj());
    this.add (p.getHitbox());

    var p = new Collectable(2, this.pickup);
    p.move(0, 0, -12);
    this.premios.push(p.getHitbox());
    this.premios_update.push(p);
    this.add (p.getObj());
    this.add (p.getHitbox());

    var p = new Collectable(2, this.pickup);
    p.move(-125, 0, 0);
    this.premios.push(p.getHitbox());
    this.premios_update.push(p);
    this.add (p.getObj());
    this.add (p.getHitbox());

    var p = new Collectable(32, this.pickup);
    p.move(0, 30, 0);
    this.premios.push(p.getHitbox());
    this.premios_update.push(p);
    this.add (p.getObj());
    this.add (p.getHitbox());
  }

  // Se carga el modelo y animaciones del jugador, se crea su collision box
  // y se inicializa la clase del jugador
  createPlayer(){
    this.characterControls;
    this.figura;
    this.model;

    var that = this;
    new GLTFLoader().load( './models/gltf/robot.glb', function ( gltf ) {
      const model = gltf.scene;
      model.traverse( function ( object ) {
        if (object.isMesh) object.castShadow = true;
      });
      model.scale.set(0.5, 0.5, 0.5);
      model.rotation.y = Math.PI;
      model.position.y=-1.20;
      var bounding = new THREE.BoxHelper ( model ) ;
      bounding.geometry.computeBoundingBox ();
      var bb=bounding.geometry.boundingBox;
      var geom=new THREE.BoxGeometry(0.01, bb.max.y-bb.min.y, 0.01); //var geom=new THREE.BoxGeometry(bb.max.x-bb.min.x-1.35, bb.max.y-bb.min.y, bb.max.z-bb.min.z);
      var mat= new THREE.MeshBasicMaterial({transparent:true, opacity:0});
      var matfisico= PHY.createMaterial(mat,0.9,0);
      var figura=new PHY.BoxMesh(geom,matfisico,1);
      figura.position.set(0,1.2,0)
      figura.add(model);
      that.add(figura);
      var restriccionHitbox=new PHY.DOFConstraint(figura,model)
      that.addConstraint(restriccionHitbox);
      restriccionHitbox.setAngularLowerLimit({x:0,y:0,z:0})
      restriccionHitbox.setAngularUpperLimit({x:0,y:0,z:0})

      const gltfAnimations = gltf;
      const mixer = new THREE.AnimationMixer( model );
      const animationsMap = that.createActions(gltf.animations, mixer);
      var sounds = [that.fall, that.jump, that.hookyes, that.hookno]
      that.characterControls = new Player(model,figura, mixer, animationsMap, that.cameraControl,that.suelos, that.camera, 'Idle', that.LuzPuntual, sounds);
    }); 
  }

  createSkybox(){
    var skyboxImagepaths = []
    skyboxImagepaths.push('./imgs/indigo_ft.jpg');
    skyboxImagepaths.push('./imgs/indigo_bk.jpg');
    skyboxImagepaths.push('./imgs/indigo_up.jpg');
    skyboxImagepaths.push('./imgs/indigo_dn.jpg');
    skyboxImagepaths.push('./imgs/indigo_rt.jpg');
    skyboxImagepaths.push('./imgs/indigo_lf.jpg');

    var materialArray = skyboxImagepaths.map(image => {
      let texture = new THREE.TextureLoader().load(image);

      return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
    });

    var skyboxGeo = new THREE.BoxGeometry(5000, 5000, 5000);
    var skyboxmesh = new THREE.Mesh(skyboxGeo, materialArray);
    this.skybox = new THREE.Object3D();
    this.skybox.add(skyboxmesh);
    this.add(this.skybox);
  }

  createRaycaster(){

      this.raycaster = new THREE.Raycaster();
      this.raycaster.near = 0;
      this.raycaster.far = 0.5;
      this.direcciones_raycaster = []

      // 4 direcciones basicas plano XZ
      this.direcciones_raycaster.push(new THREE.Vector3(1, 0, 0));
      this.direcciones_raycaster.push(new THREE.Vector3(-1, 0, 0));
      this.direcciones_raycaster.push(new THREE.Vector3(0, 0, 1));
      this.direcciones_raycaster.push(new THREE.Vector3(0, 0, -1));

      //Diagonales
      this.direcciones_raycaster.push((new THREE.Vector3(1, 0, 1)).normalize());
      this.direcciones_raycaster.push((new THREE.Vector3(-1, 0, 1)).normalize());
      this.direcciones_raycaster.push((new THREE.Vector3(1, 0, -1)).normalize());
      this.direcciones_raycaster.push((new THREE.Vector3(-1, 0, -1)).normalize());

      //Arriba y abajo
      this.direcciones_raycaster.push(new THREE.Vector3(0, 1, 0));
      this.direcciones_raycaster.push(new THREE.Vector3(0, -1, 0));

      //Direccionales arriba
      this.direcciones_raycaster.push((new THREE.Vector3(1, 1, 1)).normalize());
      this.direcciones_raycaster.push((new THREE.Vector3(-1, 1, 1)).normalize());
      this.direcciones_raycaster.push((new THREE.Vector3(1, 1, -1)).normalize());
      this.direcciones_raycaster.push((new THREE.Vector3(-1, 1, -1)).normalize());

      //Direccionales abajo
      this.direcciones_raycaster.push((new THREE.Vector3(1, -1, 1)).normalize());
      this.direcciones_raycaster.push((new THREE.Vector3(-1, -1, 1)).normalize());
      this.direcciones_raycaster.push((new THREE.Vector3(1, -1, -1)).normalize());
      this.direcciones_raycaster.push((new THREE.Vector3(-1, -1, -1)).normalize());
  }
  
  createRenderer (myCanvas) {
    // Se recibe el lienzo sobre el que se van a hacer los renderizados. Un div definido en el html.
    
    // Se instancia un Renderer   WebGL
    this.renderer = new THREE.WebGLRenderer();
    
    // Se establece un color de fondo en las imágenes que genera el render
    this.renderer.setClearColor(new THREE.Color(0xEEEEEE), 1.0);
    
    // Se establece el tamaño, se aprovecha la totalidad de la ventana del navegador
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    // La visualización se muestra en el lienzo recibido
    $(myCanvas).append(this.renderer.domElement);
  }

  createLabelRenderer(myCanvas){
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize( window.innerWidth, window.innerHeight );
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0px';
    $(myCanvas).append(this.labelRenderer.domElement);

  }
  
  /// Método que actualiza la razón de aspecto de la cámara y el tamaño de la imagen que genera el renderer en función del tamaño que tenga la ventana
  onWindowResize () {
    this.setCameraAspect (window.innerWidth / window.innerHeight);
    this.renderer.setSize (window.innerWidth, window.innerHeight);
    this.labelRenderer.setSize( window.innerWidth, window.innerHeight );
  }

  // Creamos una camara dummy para el menu
  createCameraMenu(){
    this.cameraDummy = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.cameraDummy.position.set(1000,1000,1000);
    var Menu_geom=new THREE.PlaneGeometry(20,10);
    var loader=new THREE.TextureLoader();
    var textura=loader.load('./imgs/menu_texture.png');
    var Menu_mat=new THREE.MeshBasicMaterial({map : textura});
    this.Menu=new THREE.Mesh(Menu_geom,Menu_mat);
    this.Menu.position.set(this.cameraDummy.position.x,this.cameraDummy.position.y-0.5,this.cameraDummy.position.z-10);
    this.add(this.cameraDummy);
    this.add(this.Menu); 
  }

  destroyMenu(){
    this.Menu.geometry.dispose();
  }

  createCamera () {
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
    this.camera.position.x=0;
    this.camera.position.y=5+2;
    this.camera.position.z=10;
    this.add (this.camera);
    
    // Para el control de cámara usamos una clase que ya tiene implementado los movimientos de órbita
    this.cameraControl = new OrbitControls (this.camera, this.renderer.domElement);
    this.cameraControl.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
    this.cameraControl.minPolarAngle = 0.2;
    // Se configuran las velocidades de los movimientos
    this.cameraControl.enableDamping = true;
    this.cameraControl.minDistance = 5;
    this.cameraControl.maxDistance = 15;
    this.cameraControl.enablePan = false;
    this.cameraControl.maxPolarAngle = Math.PI / 2 - 0.05;
    // Debe orbitar con respecto al punto de mira de la cámara
    this.cameraControl.update();
  }

  createHUD() {

    // Creamos la mirilla para el gancho
    var texture = THREE.ImageUtils.loadTexture( "./imgs/crosshair.png" );
    var geom = new THREE.BoxGeometry(1, 1, 1);
    var mat = new THREE.MeshLambertMaterial({ map : texture, transparent: true });
    mat.vertexColors = true;
    mat.emissive = new THREE.Color(0xb2b2b2);
    mat.emissiveMap = texture;
    var plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    this.crosshair = new THREE.Object3D();
    this.crosshair.add(plane);
    this.camera.add(this.crosshair);
    this.crosshair.position.set(0, 2.35, -10);
    this.crosshair.visible = false;

    //Creamos los trofeos coleccionables
    texture = THREE.ImageUtils.loadTexture( "./imgs/trophy.png" );
    var offset = 0.1;
    for (var i=0; i<this.premios.length; i++) {
      var mat = new THREE.MeshLambertMaterial({ map : texture, transparent: true, opacity: 0.35 });
      mat.vertexColors = true;
      mat.emissive = new THREE.Color(0xb2b2b2);
      mat.emissiveMap = texture;
      var hud = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.08), mat);
      var obj = new THREE.Object3D();
      obj.add(hud);
      this.premios_hud.push(hud);
      this.premios_hud[i].position.set(-0.70 + offset*i, 0.35, -1);
      this.camera.add(this.premios_hud[i]);

    //Creamos el cronometro
    this.time=new THREE.Clock();
    this.time.start();
    this.timediv=document.createElement('time');
    this.timediv.className='time';
    this.timediv.style.marginTop='-1em';
    this.timediv.style.backgroundColor='#000000';
    this.timediv.style.color='#2DFF56';
    this.timediv.style.fontSize='1.5em';
    this.timediv.style.fontFamily='Gruppo';
    //this.timediv.style.padding='0.5em';
    const cronometro=new CSS2DObject(this.timediv);
    cronometro.position.set(0.70,0.35,-1);
    this.camera.add(cronometro);

    

    }
  }

  createAudio(){

    // Creamos el listener
    const listener = new THREE.AudioListener();
    // Añadimos a la cámara el listener
    this.camera.add( listener );
  
    // Cargamos el sonido de pickup
    const audioLoader = new THREE.AudioLoader();

    // Cargamos el sonido de recoger
    const pick = new THREE.Audio( listener );
    this.pickup = pick;
    audioLoader.load( './sound/pickup.ogg', function( buffer ) {
      pick.setBuffer( buffer );
      pick.setLoop(false);
      pick.setVolume( 2.0 );
    });

    // Cargamos el sonido de perder
    const caerse = new THREE.Audio( listener );
    this.fall = caerse;
    audioLoader.load( './sound/fall.ogg', function( buffer ) {
      caerse.setBuffer( buffer );
      caerse.setLoop(false);
      caerse.setVolume( 0.1 );
    });

    const jump = new THREE.Audio( listener );
    this.jump = jump;
    audioLoader.load( './sound/jump.wav', function( buffer ) {
      jump.setBuffer( buffer );
      jump.setLoop(false);
      jump.setVolume( 0.5 );
    });

    const music = new THREE.Audio( listener );
    audioLoader.load( './sound/ost.ogg', function( buffer ) {
      music.setBuffer( buffer );
      music.setVolume( 0.2 );
      music.setLoop(true);
      music.play()
    });

    const victory = new THREE.Audio( listener );
    audioLoader.load('./sound/fan2.ogg',function(buffer){
      victory.setBuffer(buffer);
      victory.setLoop(true);
      victory.setVolume(0.2);
    });

    const hookyes = new THREE.Audio( listener );
    audioLoader.load( './sound/hookyes.ogg', function( buffer ) {
      hookyes.setBuffer( buffer );
      hookyes.setVolume( 1.3 );
      hookyes.setLoop(false);
    });

    const hookno = new THREE.Audio( listener );
    audioLoader.load( './sound/hookno.ogg', function( buffer ) {
      hookno.setBuffer( buffer );
      hookno.setVolume( 1.0 );
      hookno.setLoop(false);
    });

    this.hookyes = hookyes;
    this.hookno = hookno;
    this.victory = victory;
    this.music = music
  }

  createActions (animations, mixer) {
    // Se crea un mixer para dicho modelo
    // El mixer es el controlador general de las animaciones del modelo, 
    //    las lanza, las puede mezclar, etc.
    // En realidad, cada animación tiene su accionador particular 
    //    y se gestiona a través de dicho accionador
    // El mixer es el controlador general de los accionadores particulares

    // El siguiente diccionario contendrá referencias a los diferentes accionadores particulares 
    // El diccionario Lo usaremos para dirigirnos a ellos por los nombres de las animaciones que gestionan
    var actions = new Map();
    // Los nombres de las animaciones se meten en este array, 
    // para completar el listado en la interfaz de usuario
    
    for (var i = 0; i < animations.length; i++) {
      // Se toma una animación de la lista de animaciones del archivo gltf
      var clip = animations[i];
      
      // A partir de dicha animación obtenemos una referencia a su accionador particular
      var action = mixer.clipAction (clip);
      
      // Añadimos el accionador al diccionario con el nombre de la animación que controla
      //actions[clip.name] = action;
      actions.set(clip.name, action);
    }

    return actions;
  }
  
  createLights () {

    // Luz ambiental
    var ambientLight = new THREE.AmbientLight(0xccddee, 0.45);
    this.add (ambientLight);
    
    //  Focos en cada trofeo
    var foco1 = new THREE.SpotLight( 0xffffff, 1, 20, Math.PI );
    foco1.position.set(0, 13, 80);
    this.add (foco1);

    var foco2 = new THREE.SpotLight( 0xffffff, 1, 20, Math.PI );
    foco2.position.set(0, 13, -115);
    this.add (foco2);

    var foco3 = new THREE.SpotLight( 0xffffff, 1, 10, Math.PI );
    foco3.position.set(0, 8, -12);
    this.add (foco3);

    var foco4 = new THREE.SpotLight( 0xffffff, 1, 20, Math.PI );
    foco4.position.set(-125, 13, 0);
    this.add (foco4);

    var foco5 = new THREE.SpotLight( 0xffffff, 1, 20, Math.PI );
    foco5.position.set(0, 40, 0);
    this.add (foco5);

    var direccional = new THREE.DirectionalLight( 0xffffff, 0.4 );
    this.add (direccional)

    this.LuzPuntual = new THREE.PointLight( 0xffffff, 0.8, 10 );
    this.LuzPuntual.position.set(0, 2, 0);
    this.add(this.LuzPuntual);

    var LuzPuntua2 = new THREE.PointLight( 0xffffff, 0.8, 20 );
    LuzPuntua2.position.set(0, 25, 0);
    this.add(LuzPuntua2);
  }

  timeString(){
    var tiempo = this.time.getElapsedTime().toFixed(2);
    var minutos = Math.floor(tiempo / 60);
    var segundos = tiempo % 60;
    var res="";
    if(minutos > 0){
      res += minutos.toString() + ":";
    }
    res += segundos.toFixed(2).toString();
    return res;
  }
  
  getCamera () {
    if(!this.menu) {
    return this.camera;
    } else{
      return this.cameraDummy;
    }
  }
  
  setCameraAspect (ratio) {
    this.camera.aspect = ratio;
    this.camera.updateProjectionMatrix();
  }

  // Comprueba si hay colision con un coleccionable
  checkColision(){
    if (this.characterControls)
    {
      var punto = this.characterControls.getPosition();

      //Por cada raycast, detectamos si hubo colisiones
      for (var i=0; i < this.direcciones_raycaster.length; i++)
      {
        this.raycaster.set(punto, this.direcciones_raycaster[i]);
        var objeto = this.raycaster.intersectObjects(this.premios);
        //Si hay colisión, recogemos el coleccionable
        if (objeto.length > 0 && objeto[0].object.visible == true){
          objeto[0].object.visible = false;
          this.premios_hud[this.pickup_count].material.opacity = 1;
          this.pickup_count += 1;
          if(this.pickup_count == this.premios.length){
            this.characterControls.to_win();
            this.time.stop();
            this.timediv.style.color='#004DFF';
            this.music.stop();
            this.victory.play()
          }
        }
      }
    }
  }

  // Comprueba que el jugador haya muerto por una caida
  checkPlayerDead(){
    if (this.characterControls)
    {
      var punto = this.characterControls.getPosition();
      if (punto.y < -20)
      {
        this.characterControls.to_lose();
      }
    }
  }
  
  update () {
    // Medida del tiempo transcurrido
    var timeInSeconds = this.clock.getDelta();

    this.checkColision();
    this.checkPlayerDead();

    
    this.timediv.textContent=this.timeString();

    for (var i = 0; i < this.premios_update.length; i++) {
      this.premios_update[i].update();
    }
    this.cohete.update(); 
    
    // Se actualiza la posición de la cámara según su controlador 

    this.cameraControl.update();
    
    // Se le pide al motor de física que actualice las figuras según sus leyes
    this.simulate ();
    
    // Se le pide al renderer que renderice la escena que capta una determinada cámara, que nos la proporciona la propia escena.
    this.renderer.render(this, this.getCamera());
    this.labelRenderer.render(this, this.getCamera());

    // Por último, se solicita que la próxima vez que haya que refrescar la ventana se ejecute una determinada función, en este caso la funcion render.
    // La propia función render es la que indica que quiere ejecutarse la proxima vez
    // Por tanto, esta instrucción es la que hace posible que la función  render  se ejecute continuamente y por tanto podamos crear imágenes que tengan en cuenta los cambios que se la hayan hecho a la escena después de un render.
    requestAnimationFrame(() => this.update());
    if (this.characterControls) {
      this.characterControls.update(timeInSeconds, this.key_pressed);
    }

  }
};


/// La función principal
$(function () {
  // Se crea la escena
  var scene = new MyPhysiScene ("#WebGL-output","#2D-output");


  
  // listeners
  // Cada vez que el usuario cambie el tamaño de la ventana se llama a la función que actualiza la cámara y el renderer
  window.addEventListener ("resize", () => scene.onWindowResize());
  
  // Definimos un listener para el mouse down del ratón para los impulsos a las figuras
  //window.addEventListener ("mousedown", () => scene.onMouseDown(event), true);
  window.addEventListener ("keydown", (ev) => {
      scene.key_pressed[ev.key.toLowerCase()] = true;

      if (ev.key.toLowerCase() == 'c'){
        scene.characterControls.changeBaseVel();
      }

  });
  window.addEventListener ("keyup", (ev) => {
    scene.key_pressed[ev.key.toLowerCase()] = false;
  });

  window.addEventListener ("mousedown", (ev) => {
    if(scene.menu){
      scene.menu=false;
      scene.destroyMenu();
    } else{

    var mouse=new THREE.Vector2();

    if (ev.button == 0) {
      if (scene.moving_camera == false){
        mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
        mouse.y = 1 - 2 * (ev.clientY / window.innerHeight) ;
      }
      else {
        mouse.x = 0;
        mouse.y = 0.55;
      }


      scene.characterControls.try_hook(scene,mouse,scene.line);
      scene.hook=true;
    }

    if (ev.button == 2) {
      scene.moving_camera = true;
      scene.crosshair.visible = true;
    }

  }
    
  });

  window.addEventListener ("mouseup", (ev) => {
    if(!scene.menu){

    if (ev.button == 0) {
      scene.characterControls.release_hook(scene);
    }

    if (ev.button == 2) {
      scene.moving_camera = false;
      scene.crosshair.visible = false;
    }
    }
  });


  
  // Finalmente, realizamos el primer renderizado.
  scene.update();
});

