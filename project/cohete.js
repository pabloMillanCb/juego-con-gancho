import {OBJLoader} from '../libs/OBJLoader.js'
import {MTLLoader} from '../libs/MTLLoader.js'
import * as THREE from '../libs/three.module.js'
import * as TWEEN from '../libs/tween.esm.js'

class Cohete extends THREE.Object3D {
    constructor(scene){
        super();
        var materialLoader = new MTLLoader();
        var objectLoader = new OBJLoader();
        this.Cohete=[];
        this.obj;
        materialLoader.load('../models/obj/cartoon_rocket.mtl',
        (materials) => {
          objectLoader.setMaterials(materials);
          objectLoader.load('../models/obj/cartoon_rocket.obj',
          (object) => {
            object.scale.set(0.06,0.06,0.06);
            object.position.set(-30,3,-70);
            object.rotation.set(0,Math.PI/2,0);
            var texture1=new THREE.TextureLoader().load('../imgs/strt_point.png');
            var texture2=new THREE.TextureLoader().load('../imgs/wash_machine_rocket.png');
            
            object.children[1].material.map=texture2;
            object.children[4].material.map=texture1;
            for(var i=0;i<object.children.length;i++){
                object.children[i].castShadow=true;
                object.children[i].receiveShadow=true;
            }
            this.add(object);

        },null,null);});
        // Construimos asteroide donde esta el cohete aparcado
        var geometry = new THREE.SphereGeometry(12.50, 32, 32);
        var material = new THREE.MeshPhongMaterial({color: 0xffffff});
        var sphere = new THREE.Mesh(geometry, material);
        var texture = new THREE.TextureLoader().load('../imgs/lunarrock_d.png');
        sphere.material.map=texture;
        sphere.position.set(-30,-5,-70);
        this.add(sphere);
        // Construimos animacion cohete
        var origin={y:5,};
        var target={y:10};
        var time=4000;
        this.tween = new TWEEN.Tween(origin).to(target, time)
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate(() => {
            this.position.y=origin.y;
            //this.rotateOnAxis(new THREE.Vector3(0,1,0),origin.r);
        })
        .yoyo(true)
        .repeat(Infinity)
        .start();
    }

    update(){
        TWEEN.update();
    }




}

export {Cohete}