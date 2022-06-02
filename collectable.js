import * as THREE from './libs/three.module.js'
import { CSG } from './libs/CSG-v2.js'
import * as TWEEN from './libs/tween.esm.js'

class Collectable {

    constructor(h, sonido){

    // Creamos el material del trofeo
    this.dorado = new THREE.MeshPhongMaterial({color: 0xd4bb57});

    // Creamos las geomterias del trofeo
    this.copa1 = new THREE.CylinderGeometry(5, 2, 8, 24, 1);
    this.copa2 = new THREE.CylinderGeometry(5, 2, 8, 24, 1);
    this.nodoenganche = new THREE.SphereGeometry(2.5, 24, 24);
    this.toro = new THREE.TorusGeometry(2, 0.5, 24, 24);
    this.toro2 = new THREE.TorusGeometry(2, 0.5, 24, 24);
    this.palo = new THREE.CylinderGeometry(0.2, 1.5, 6, 24, 1);
    this.caja = new THREE.BoxGeometry(4, 2, 4,);

    //Movemos las geometrías para las operaciones booleanas
    this.copa2.translate(0, 0.3, 0);
    this.nodoenganche.translate(0, -2.5, 0);
    this.toro.translate(-3.5, 0, 0);
    this.toro2.translate(3.5, 0, 0);
    this.palo.translate(0, -6, 0);
    this.caja.translate(0, -8, 0);

    //Creamos los Mesh
    this.copa1mesh = new THREE.Mesh(this.copa1, this.dorado);
    this.copa2mesh = new THREE.Mesh(this.copa2, this.dorado);
    this.nodomesh = new THREE.Mesh(this.nodoenganche, this.dorado);
    this.toromesh = new THREE.Mesh(this.toro, this.dorado);
    this.toromesh2 = new THREE.Mesh(this.toro2, this.dorado);
    this.palomesh = new THREE.Mesh(this.palo, this.dorado);
    this.cajamesh = new THREE.Mesh(this.caja, this.marron);

    // Realizamos las operaciones booleanas
    this.csg = new CSG();
    this.csg.union ([this.copa1mesh]);
    this.csg.union ([this.nodomesh]);
    this.csg.union([this.toromesh, this.toromesh2]);
    this.csg.union([this.palomesh]);
    this.csg.subtract([this.copa2mesh]);
    this.csg.union([this.cajamesh]);

    // Guardamos el Mesh resultante y creamos el Obj3D
    this.csgMesh = this.csg.toMesh();
    this.csgMesh.scale.set(0.2,0.2,0.2); 
    this.copa = new THREE.Object3D();
    this.copa.add(this.csgMesh);

    // Creamos la caja que detectará las colisiones con el jugador por raycast
    var boxGeom = new THREE.BoxGeometry (1,1,1);
    boxGeom.scale(2, 3, 2);
    var boxMat = new THREE.MeshBasicMaterial({transparent:true, opacity:0});
    this.box = new THREE.Mesh (boxGeom, boxMat);

    //Creamos las animaciones de rotar y mover
    var origen = {y: h};
    var destino = {y: h+0.3};
    var origenR = {y: 0.01};
    var destinoR = {y: 0.01};

    this.movimiento = new TWEEN.Tween(origen).to(destino, 1200);
    this.movimientoR = new TWEEN.Tween(origenR).to(destinoR, 5000);

    this.movimiento.onUpdate (() =>{
      this.copa.position.y = origen.y;
      this.box.position.y = origen.y;
    });
    this.movimiento.yoyo(true).repeat(Infinity);
    this.movimiento.start();

    this.movimientoR.onUpdate (() =>{
      this.copa.rotateOnAxis(new THREE.Vector3(0,1,0), origenR.y);
    });
    this.movimientoR.yoyo(true).repeat(Infinity);
    this.movimientoR.start();

    //Creamos la animación de recolección
    var targetPosition = new THREE.Vector3( 0, 0, 0 );
    this.obtenerAnimacion = new TWEEN.Tween( this.csgMesh.scale )
    	.to( targetPosition, 200 )
        .easing( TWEEN.Easing.Cubic.InOut );


    this.last_visible = true;
    this.sound = sonido;
    
    }

    // Devuelve el objeto de la copa
    getObj()
    {
        return this.copa;
    }

    // Devuelve el objeto de la hitbox
    getHitbox()
    {
        return this.box;
    }

    move(x, y, z)
    {
        this.copa.position.x = x;
        this.copa.position.y = y;
        this.copa.position.z = z;

        this.box.position.x = x;
        this.box.position.y = y;
        this.box.position.z = z;
    }

    update()
    {
        //Si se ha recogido, reproducir animación de recoger
        if (this.last_visible == true && this.box.visible == false)
        {
            this.sound.play();
            this.obtenerAnimacion.start();
            this.movimiento.stop();
            this.movimientoR.stop();
        }

        this.last_visible = this.box.visible;
        TWEEN.update();
    }

}


export {Collectable}