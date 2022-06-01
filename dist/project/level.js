import * as THREE from '../libs/three.module.js'
import * as PHY from '../libs/physi.esm.js'

class Level {
    constructor(scene){
    
        this.suelos = [];

        var geometry = new THREE.BoxGeometry (35,0.2,35);
        var geometry2 = new THREE.BoxGeometry (20,0.2,20);
        var geo_plat = new THREE.BoxGeometry (7,0.2,7);
        var geo_cube = new THREE.BoxGeometry (3,3,3);
        var cil_geo = new THREE.CylinderGeometry(3, 3, 29.5, 24);

        geometry.translate(0,-0.1,0);

        // Como material se crea uno a partir de una textura
        var texture = new THREE.TextureLoader().load('./imgs/lunarrock_d.png');
        var texture2 = new THREE.TextureLoader().load('./imgs/stone_wall02.png');
        var material = new THREE.MeshPhongMaterial ({map: texture});
        var material2 = new THREE.MeshPhongMaterial ({map: texture2});
        //var materialDark = new THREE.MeshPhongMaterial ({map: texture, color: 0xbfbfbf});
        // Por último se añade el suelo a la escena
        var physiMaterial = PHY.createMaterial (material, 0.2, 0.1);
        // Al suelo se le da masa 0 para que no caiga por la gravedad

        // Plataforma central
        var ground = new PHY.BoxMesh (geometry, physiMaterial, 0);
        var cil1 = new PHY.CylinderMesh(cil_geo, physiMaterial, 0);
        cil1.translateX(15);
        cil1.translateZ(15);
        cil1.translateY(15);
        var cil2 = new PHY.CylinderMesh(cil_geo, physiMaterial, 0);
        cil2.translateX(-15);
        cil2.translateZ(15);
        cil2.translateY(15);
        var cil3 = new PHY.CylinderMesh(cil_geo, physiMaterial, 0);
        cil3.translateX(15);
        cil3.translateZ(-15);
        cil3.translateY(15);
        var cil4 = new PHY.CylinderMesh(cil_geo, physiMaterial, 0);
        cil4.translateX(-15);
        cil4.translateZ(-15);
        cil4.translateY(15);

        // Camino de la derecha
        var plat_1 = new PHY.BoxMesh (geo_plat, physiMaterial, 0);
        plat_1.translateZ(25);
        plat_1.translateX(5);
        var plat_2 = new PHY.BoxMesh (geo_plat, physiMaterial, 0);
        plat_2.translateZ(35);
        plat_2.translateX(-5);
        var plat_3 = new PHY.BoxMesh (geo_plat, physiMaterial, 0);
        plat_3.translateZ(45);
        plat_3.translateX(5);
        var ground2 = new PHY.BoxMesh (geometry, physiMaterial, 0);
        ground2.translateZ(72);

        // Camino de la izquierda
        var ground3 = new PHY.BoxMesh (geometry, physiMaterial, 0);
        ground3.translateZ(-100);
        var cubo1 = new THREE.Mesh (new THREE.BoxGeometry(3, 3, 3), material2);
        cubo1.translateY(15);
        //cubo1.translateX(-8);
        cubo1.translateZ(-50);

        // Camino de atras
        var ground4 = new PHY.BoxMesh (geometry2, physiMaterial, 0);
        ground4.translateX(-50);
        var ground5 = new PHY.BoxMesh (geometry2, physiMaterial, 0);
        ground5.translateX(-120);
        var cubo2 = new THREE.Mesh (new THREE.BoxGeometry(3, 3, 3), material2);
        cubo2.translateY(15);
        cubo2.translateX(-50);
        var cubo3 = new THREE.Mesh (new THREE.BoxGeometry(3, 3, 3), material2);
        cubo3.translateY(15);
        cubo3.translateX(-120);

        //Camino de adelante
        var groundUp = new PHY.BoxMesh (geometry, physiMaterial, 0);
        groundUp.translateY(30);
        var ground6 = new PHY.BoxMesh (geometry, physiMaterial, 0);
        ground6.translateY(7);
        ground6.translateX(50);
        var cubo4 = new THREE.Mesh (new THREE.BoxGeometry(3, 3, 3), material2);
        cubo4.translateY(12);
        cubo4.translateX(30);

        var ground7 = new PHY.BoxMesh (geometry, physiMaterial, 0);
        ground7.translateY(14);
        ground7.translateX(40);
        ground7.translateZ(40);
        var cubo5 = new THREE.Mesh (new THREE.BoxGeometry(3, 3, 3), material2);
        cubo5.translateY(19);
        cubo5.translateX(40);
        cubo5.translateZ(30);

        var ground8 = new PHY.BoxMesh (geometry, physiMaterial, 0);
        ground8.translateY(21);
        ground8.translateX(0);
        ground8.translateZ(30);
        var cubo6 = new THREE.Mesh (new THREE.BoxGeometry(3, 3, 3), material2);
        cubo6.translateY(26);
        cubo6.translateX(10);
        cubo6.translateZ(30);

        var cubo7 = new THREE.Mesh (new THREE.BoxGeometry(3, 3, 3), material2);
        cubo7.translateY(35);
        cubo7.translateZ(15);

        this.suelos.push(ground);
        this.suelos.push(ground2);
        this.suelos.push(plat_1);
        this.suelos.push(plat_2);
        this.suelos.push(plat_3);
        this.suelos.push(ground3);
        this.suelos.push(cubo1);
        this.suelos.push(ground4);
        this.suelos.push(cil1);
        this.suelos.push(cil2);
        this.suelos.push(cil3);
        this.suelos.push(cil4);
        this.suelos.push(ground5);
        this.suelos.push(cubo2);
        this.suelos.push(cubo3);
        this.suelos.push(groundUp);
        this.suelos.push(ground6);
        this.suelos.push(cubo4);
        this.suelos.push(ground7);
        this.suelos.push(cubo5);
        this.suelos.push(ground8);
        this.suelos.push(cubo6);
        this.suelos.push(cubo7);
    }

    getSuelos(){
        return this.suelos;
    }

}

export {Level};