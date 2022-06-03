import * as THREE from './libs/three.module.js'
import * as TWEEN from './libs/tween.esm.js'

class Player {

    constructor(modelo, collisioner, mixer, mapaAnimaciones, orbitControl, suelos,camera, accionActual, luz, sounds){

        // Variables de control de movimiento
        this.runvelocity = 17;
        this.walkvelocity = 10;
        this.fadein = 0.5;

        this.modelo = modelo;
        this.collisioner= collisioner;
        this.mixer = mixer;
        this.mapaAnimaciones = mapaAnimaciones;
        this.orbitControl = orbitControl;
        this.camera = camera;
        this.suelos=suelos

        // Variables de control de la camara
        this.accionActual = accionActual;
        this.walkDirection= new THREE.Vector3();
        this.rotateAngle= new THREE.Vector3(0,1,0);
        this.rotateQuaternion= new THREE.Quaternion();
        this.cameraTarget= new THREE.Vector3();

        // Raycaster para colisiones
        this.raycaster_ground= new THREE.Raycaster(collisioner.position, new THREE.Vector3(0,-1,0), 0, 1.5);
        this.raycaster_ceil= new THREE.Raycaster(collisioner.position, new THREE.Vector3(0,1,0), 0, 1.5);

        // Variables para el gancho
        this.raycaster_hook= new THREE.Raycaster()
        this.raycaster_hook.far = 80;
        this.punto;
        this.line;

        // Variables de control
        this.current_speed = 10;
        this.airbone=false
        this.hooked=false;
        this.corriendo_base = true;
        this.inercy=false;
        this.lose = false;
        this.block_movement=false;

        // Se cargan los sonidos
        this.sounds = sounds;

        //Luz que acompaña al jugador
        this.luz_puntual = luz;

        // Se crean la animacion de muerte
        var death_animation_scale_origin={ p:0.5};
        var death_animation_scale_end={ p:0.01};
        this.death_animation=new TWEEN.Tween(death_animation_scale_origin).to(death_animation_scale_end,2600)
        .onUpdate(()=>{this.modelo.scale.set(death_animation_scale_origin.p,death_animation_scale_origin.p,death_animation_scale_origin.p)})
        .onComplete(()=>{
            this.modelo.scale.set(0.5,0.5,0.5);
            this.death_animation_scale_origin=0.5;
            this.respawn(0,5,0);
            })
        .onStart(()=>{this.sounds[0].play()})
        .easing(TWEEN.Easing.Linear.None);

        this.mapaAnimaciones.forEach((value, key) => {
            if (key == accionActual) {
                value.play();
            }
        });
    }

    // Se comprueba si está tocando el suelo para descativar las físicas
    checkGroundCollision(){
        this.raycaster_ground.set(this.collisioner.position, new THREE.Vector3(0,-1,0));
        var intersects = this.raycaster_ground.intersectObjects(this.suelos);
        if (intersects.length > 0) {
            this.airbone=false;
        } else {
            this.airbone=true;
        }
    }

    // Se comprueba si se está chocando contra el techo para limitar el movimiento en Y
    checkCeilCollision(){
        this.raycaster_ceil.set(this.collisioner.position, new THREE.Vector3(0,1,0));
        var intersects = this.raycaster_ceil.intersectObjects(this.suelos);
        if (intersects.length > 0) {
            this.ceil=true;
        } else {
            this.ceil=false;
        }
    }

    getPosition(){
        var punto = new THREE.Vector3(this.collisioner.position.x, this.collisioner.position.y, this.collisioner.position.z);
        return punto;
    }

    getOrbitControl(){
        return this.orbitControl;
    }

    // Mover el personaje a unas coordenadas, cancelando toda su velocidad acumulada
    moveTo(x, y, z){
        this.collisioner.__dirtyPosition = false;
        this.collisioner.position.x=x;
        this.collisioner.position.y=y;
        this.collisioner.position.z=z;
        this.collisioner.__dirtyPosition = true;
        this.collisioner.setLinearVelocity(new THREE.Vector3(0,0,0));
        this.collisioner.setAngularVelocity(new THREE.Vector3(0,0,0));
    }

    // Hacer que el personaje reaparezca en una posición determinada
    respawn(x, y, z){
        this.collisioner.__dirtyPosition = false;
        this.collisioner.position.x=x;
        this.collisioner.position.y=y;
        this.collisioner.position.z=z;
        this.collisioner.__dirtyPosition = true;
        this.collisioner.setLinearVelocity(new THREE.Vector3(0,0,0));
        this.collisioner.setAngularVelocity(new THREE.Vector3(0,0,0));
        this.lose = false;
    }

    // Si pierde, se activa la animación de muerte
    to_lose(){
        if (this.lose == false){
            this.lose = true;
            this.death_animation.start();
            
        }
    }

    // Si se ha ganado se restringe el movimiento del personaje para iniciar
    // el baile de la victoria
    to_win(){
        this.block_movement = true;
        const current = this.mapaAnimaciones.get(this.accionActual);
        current.fadeOut(this.fadein);
        this.accionActual="Dance";
        this.mapaAnimaciones.get("Dance").reset().fadeIn(this.fadein).play();
        this.orbitControl.autoRotate=true;
        
    }

    // Direccion a la que está mirando el personaje.
    getDirection(){
        var dir = new THREE.Vector3(wd.x, wd.y, wd.z);
        return dir;
    }

    // Si estamos enganchados actualiza la posición del personaje
    hook_movement(teclas,delta){

        const hook_conf= teclas['shift'];
        var vector_gancho=new THREE.Vector3(0,0,0)
        vector_gancho.subVectors(this.collisioner.position,this.punto);   
         if(hook_conf){
            var hook_velocity=vector_gancho.multiplyScalar(2*delta);
            if(teclas['shift']){
                var var_acercarse=new THREE.Vector3(0,0,0);
                var_acercarse.subVectors(this.collisioner.position,hook_velocity);
                if(!this.ceil){
                this.moveTo(var_acercarse.x,var_acercarse.y,var_acercarse.z);
                }
            }
        }
    }

    update (delta, teclas){

        // Si estamos enganchados dibujamos el cable
        if(this.hooked){
            if(this.line.visible==false){
                this.line.visible=true;
            }
            var points=[this.collisioner.position,this.punto];
            var line=new THREE.BufferGeometry()
            line.setFromPoints(points);
            this.line.geometry.dispose();
            this.line.geometry=line;
        }

        // Si hay inercia en el movimiento del gancho se apllica un 
        // impulso
        if(this.inercy){
            var vector_gancho=new THREE.Vector3(0,0,0)
            vector_gancho.subVectors(this.punto,this.collisioner.position);   
            vector_gancho.normalize();
            var hook_velocity=vector_gancho.multiplyScalar(this.hook_force);
            this.collisioner.applyCentralImpulse(hook_velocity);
            this.inercy=false;
        }
        const directionpressed= teclas['w'] || teclas['s'] || teclas['a'] || teclas['d'];
        const jumpingstart= teclas[' ']||teclas[' '] && teclas['w']||teclas[' '] && teclas['s']||teclas[' '] && teclas['a']||teclas[' '] && teclas['d'];

        // Almacenamos qué animación debe ser reproducida en función a la acción actual
        if (!this.block_movement){

            if (teclas['shift']){
                this.corriendo = !this.corriendo_base;
            }
            else{
                this.corriendo = this.corriendo_base;
            }
            var play = '';
            if(jumpingstart && !this.airbone){

                play = 'Jump';
            } 
            else if (directionpressed && this.corriendo && !this.airbone) {
                play = 'Running';
            }
            else if(directionpressed && !this.airbone){
                play = 'Walking';
            } 
            else {
                play = 'Idle';
            } 

            // Si hemos cambiado a una nueva animación, realizamos un fade para
            // una transición suavemente. Si es la misma que antes, no hacemos nada
            if (this.accionActual != play){
                const toPlay = this.mapaAnimaciones.get(play);
                const current = this.mapaAnimaciones.get(this.accionActual);
                

                current.fadeOut(this.fadein);
                toPlay.reset().fadeIn(this.fadein).play();
                this.accionActual = play;
            }
        }

        // Dependiendo de si estamos en el suelo o en el aire, llamamos a uno de los
        // metodos para actualizar la posición de la cámara
        this.mixer.update(delta);
        if(this.hooked && this.airbone){
            this.hook_movement(teclas,delta)
            this.updateCameraTargetairbone(delta);
        }else if(this.airbone && !this.hooked){
            this.updateCameraTargetairbone(delta);

        } 
        else{
            
            // Si nos estamos moviendo calculamos el ángulo del movimiento con la cámara,
            // y aplicamos el movimiento en esa dirección.
            if (this.accionActual=='Running' || this.accionActual=="Walking" || this.accionActual=="Jump") {
                var anguloYconlacamara = Math.atan2(
                    (this.camera.position.x - this.collisioner.position.x),
                    (this.camera.position.z - this.collisioner.position.z)
                );
                var directionoffset = this.directionoffset(teclas);
                this.rotateQuaternion.setFromAxisAngle(this.rotateAngle, anguloYconlacamara + directionoffset);
                this.modelo.quaternion.rotateTowards(this.rotateQuaternion, 0.2);

                this.camera.getWorldDirection(this.walkDirection);
                this.walkDirection.y=0;
                this.walkDirection.applyAxisAngle(this.rotateAngle, directionoffset);
                this.walkDirection.normalize();

                //const speed = this.accionActual== "Running" ? this.runvelocity : this.walkvelocity;

                if (this.accionActual == "Running" && this.current_speed < this.runvelocity){
                    this.current_speed += 0.5;
                }
                else if (this.accionActual == "Walking" && this.current_speed > this.walkvelocity){
                    this.current_speed -= 0.5;
                }

                var moveX = this.walkDirection.x * this.current_speed * delta;
                var moveZ = this.walkDirection.z * this.current_speed * delta;

                if (!directionpressed){
                    moveX = 0;
                    moveZ = 0;
                }
                this.updateCameraTarget(moveX, moveZ);

                // Si estamos corriendo o en el suelo, nos movemos con dirty positions
                if(this.accionActual=='Running' || this.accionActual=="Walking"){
                    this.collisioner.__dirtyPosition = false;
                    this.collisioner.position.x-=moveX;
                    this.collisioner.position.z-=moveZ;
                    this.collisioner.__dirtyPosition = true;
                }

                // Si saltamos, nos movemos con físicas
                if(this.accionActual=='Jump'){
                    var fuerza=3;
                    var direccion=new THREE.Vector3(-moveX*1.2,1,-moveZ*1.2);
                    var effect= direccion.normalize().multiplyScalar(fuerza);
                    this.collisioner.applyCentralImpulse(effect)
                    this.airbone=true;
                    this.sounds[1].play();
                }
            }
        }

        // Se comprueban colisiones con el suelo y el techo
        this.checkGroundCollision();
        this.checkCeilCollision();

        // Si se aterriza, se elimina la velocidad acumulada del colisionador
        if (this.accionActual != "Jump" && !this.airbone){
            this.collisioner.setLinearVelocity(new THREE.Vector3(0,0,0));
            this.collisioner.setAngularVelocity(new THREE.Vector3(0,0,0));
        }

        // Se actualiza la posición de la luz puntual que acompaña al personaje.
        this.luz_puntual.position.set(this.collisioner.position.x,this.collisioner.position.y+2,this.collisioner.position.z);
    }

    changeBaseVel(){
        this.corriendo_base = !this.corriendo_base;
    }    

    // Se calcula la dirección en la que tenemos que estar caminando 
    // en función de la dirección que estemos presionando.
    directionoffset(teclas){
        var directionoffset=0;
        if(teclas["w"]) {
            if(teclas["a"]) {
                directionoffset= -(Math.PI/4)-(Math.PI/2);
            } else if (teclas["d"]) {
                directionoffset= Math.PI/4+Math.PI/2;
            }
            else{
                directionoffset = Math.PI;
            }
        }  else if (teclas["s"]) {
            if(teclas["a"]) {
                directionoffset= -(Math.PI/4)
            } else if (teclas["d"]) {
                directionoffset= Math.PI/4
            } 
        }   else if (teclas["a"]) {
            directionoffset= -Math.PI/2;
        } else if (teclas["d"]) {
            directionoffset= +Math.PI/2;
        }
        return directionoffset;
    } 

    // Cuando soltamos el gancho, si estabamos recogiéndolo salimos disparados
    // con inercia.
    release_hook(scene){
        if(this.hooked){
        this.hooked=false;
        this.line.visible=false;
            if(scene.key_pressed["shift"]){
                this.inercy=true;
            }
        }

    }

    // Probamos a enganchar el gancho en un punto determinado de la pantalla
    try_hook(scene,mouse,line){
        this.raycaster_hook.setFromCamera(mouse, this.camera);
        var intersects = this.raycaster_hook.intersectObjects(this.suelos);
        if (intersects.length > 0) {
            this.punto=intersects[0].point;
            this.hooked=true;
            this.hook_force = this.collisioner.position.distanceTo(this.punto);
            this.sounds[2].play()
        }
        else{
            this.sounds[3].play();
        }
        this.line=line;
    }

    // Actualizamos la cámara en el aire
    updateCameraTargetairbone(delta){

        if (this.lose == false){
            var velocity=this.collisioner.getLinearVelocity();
        
            this.camera.position.x -= velocity.x*delta;
            this.camera.position.y -= velocity.y*delta;
            this.camera.position.z -= velocity.z*delta;
            
            this.cameraTarget.x = this.collisioner.position.x;
            this.cameraTarget.z = this.collisioner.position.z;
            this.cameraTarget.y = this.collisioner.position.y+2;

            this.orbitControl.target= this.cameraTarget;
        }
    }

    // Actualizamos la cámara en tierra.
    updateCameraTarget(moveX,moveZ){

        //Modificamos la posición de la cámara
        this.camera.position.x -= moveX;
        this.camera.position.z -=moveZ;
        
        //Modificado el target de la cámara
        this.cameraTarget.x = this.collisioner.position.x;
        this.cameraTarget.z = this.collisioner.position.z;
        this.cameraTarget.y = this.collisioner.position.y+2;


        this.orbitControl.target= this.cameraTarget;
    }
    
}


export { Player };