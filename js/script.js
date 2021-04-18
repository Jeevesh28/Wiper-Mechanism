var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
})

var time = 0; 
var temp_time = 0;
var flag = 0;
var O2 = 0;
var teta = 0;

var omega = 2;
var pivot_motor = $V([3, -2]);
var delta_angle = (Math.PI/180)*10;
var path_points_above = [];
var path_points_below = [];
var maxO4 = 0;
var minO4 = 0;

var speedMax = 0;
var accMax =0;

//Bar lengths
var length_motor_bar = 0.6;
var length_coupler_bar = 2.8;
var length_rocker_bar = 1.6;
var length_rocker_bar_ext = 4; //used 2 times
var length_dead_bar = 1; //used 2 times
var length_wiper_bar = 2;	
var length_base = Math.sqrt(pivot_motor.e(1)*pivot_motor.e(1) + pivot_motor.e(2)*pivot_motor.e(2));

document.getElementById('base_bar').value = length_base;
document.getElementById("base_bar_val").innerHTML = `${length_base.toFixed(2)} m`;

animPD = new PrairieDrawAnim("wiper", function(t) {

    //SET UP PRAIRIEDRAW
    this.setUnits(10, 15);
    this.translate($V([0,1.5]));
    this.setProp("arrowLineWidthPx",3);
    this.addOption("velocity",false);
    this.addOption("acceleration",false);
    this.addOption("delta_label",true);

    //LENGTH AND ANGLE CALCULATIONS
    var ref_angle = Math.PI - Math.acos(pivot_motor.e(1)/length_base);

    O2 = O2 + omega*(t-time);
    var O2A = length_motor_bar; //length of crank bar
    var AB = length_coupler_bar; //length of coupler
    var BO4 = length_rocker_bar; //length of rocker
    var O4C = length_rocker_bar_ext; //length of extended rocker bar
    var O4O2 = length_base; // BASE
    var O6D = O4C; // the parallel bar
    var DC = length_dead_bar; // dead bar 
    var O6O4 = DC; // parallel to dead bar

    var AO4 = Math.sqrt(O2A*O2A + O4O2*O4O2 - 2*O2A*O4O2*Math.cos(O2));
    var B = Math.acos((BO4*BO4 + AB*AB - AO4*AO4)/(2*BO4*AB));
    var O2O4A = Math.asin(O2A * Math.sin(O2) / AO4);
    var AO4B = Math.asin(AB * Math.sin(B) / AO4);
    var O4 = O2O4A + AO4B;
    var A = 2*Math.PI - B - O4 - O2; 

    //getting difference of max and min values of angle O4 for area calculation
    if(O4 >= maxO4)
    {
        maxO4 = O4;
    }
    //console.log("maxO4 " + maxO4);
    if(O4 <= minO4)
    {
        minO4 = O4;
    }
    var angle_displ = maxO4-minO4;
    var arc_len = angle_displ*O4C; //l=theta*r
    var area = arc_len*length_wiper_bar; 
    
    if(t>2)
    {
        document.getElementById("area_val").innerHTML = `${area.toFixed(2)} m<sup>2</sup>`;
    }
    else
    {
        document.getElementById("area_val").innerHTML = `0 m<sup>2</sup>`;
    }

    //handling When motor is a ROCKER
    var sum =  (parseFloat(AB) + parseFloat(BO4) - parseFloat(0.02)).toFixed(2);
    var diff = Math.abs((parseFloat(AB) - parseFloat(BO4) + parseFloat(0.02)).toFixed(2));

    if( (parseFloat(AO4).toFixed(2) >= sum || parseFloat(AO4).toFixed(2) <= diff ) && flag == 0) // && o2 is not odd multiple of pi
    {
        flag = 1;
        omega = omega*-1;      
        document.getElementById('omegaslider').value = omega;
        setOmega();              
    }
    else if(parseFloat(AO4).toFixed(2) < sum && parseFloat(AO4).toFixed(2) > diff )
    {
        flag = 0;
    }

    if( sum < (parseFloat(O4O2)+ parseFloat(O2A)).toFixed(2) )
    {
        document.getElementById("msg").innerHTML = "Motor can't rotate completely! Change bar lengths.";
    }
    else
    {
        document.getElementById("msg").innerHTML = "";
    }
    

    //DRAW GROUND
    var G1 = $V([0, -0.3]);
    var G2 = $V([pivot_motor.e(1), pivot_motor.e(2)-0.3]);
    this.ground(G1, $V([0, 1]), 15);
    this.ground(G2, $V([0, 1]), 0.8);

    //Text for motor
    this._ctx.font = "15px Arial";
    this.text($V([pivot_motor.e(1), pivot_motor.e(2)-1]), $V([pivot_motor.e(1)-3, pivot_motor.e(2)]), "Motor" );

    //DRAW PIVOTS
    var pivot_right = $V([0, 0]);
    var pivot_left = $V([-O6O4, 0]);
    this.pivot($V([pivot_right.e(1), -0.3]), pivot_right, 0.4);
    this.pivot($V([pivot_left.e(1), -0.3]), pivot_left, 0.4);
    this.pivot($V([pivot_motor.e(1), pivot_motor.e(2)-0.3]), pivot_motor, 0.4);

    //base bar
    this.save();
    this.setProp("shapeOutlineColor", "grey");
    this.setProp("shapeStrokePattern", "dashed");
    this.line(pivot_right, pivot_motor);
    this.restore();

    this.save();
    //MOTOR BAR
    this.translate(pivot_motor);
    this.rotate(ref_angle + O2);
    this.rod($V([0,0]), $V([O2A,0]), 0.2);
    this.point($V([0,0]));

    //COUPLER BAR
    this.translate($V([O2A,0]));
    this.rotate(-(Math.PI-A)); 	
    this.rod($V([0,0]), $V([AB,0]), 0.2);
    this.point($V([0,0]));
    
    //ROCKER BAR
    this.translate($V([AB,0]));
    this.rotate(-(Math.PI-B));
    this.rod($V([0,0]), $V([BO4,0]), 0.2);
    this.point($V([0,0]));

    this.restore();

    //path generation
    this.save();
    var x;
    x = $V([O4C,0]);
    x = x.rotate(ref_angle-O4 + delta_angle, $V([0,0]));
    var y = $V([x.e(1) + 0.15/2 , x.e(2) + length_wiper_bar/2]);
    var z = $V([x.e(1) + 0.15/2 , x.e(2) - length_wiper_bar/2]);

    if(temp_time < 400)
    {
        path_points_above.push(y);
        path_points_below.push(z);
    }
        
    for(var i = 0; i<path_points_below.length; i++)
    {
        this.setProp("shapeOutlineColor", "#a8beff");
        this.line(path_points_above[i], path_points_below[i]);
    }

    this.restore();

    //Dead bar with wiper
    this.save();
    this.translate($V([-O6O4,0]));
    this.rotate(ref_angle-O4 + delta_angle);
    this.translate($V([O6D,0]));
    this.rotate(-(ref_angle-O4 + delta_angle));
    this.wiper($V([0,0]), $V([DC,0]), 0.15, length_wiper_bar);
    this.restore();

    //Extended ROCKER BAR
    this.save();
    this.rotate(ref_angle-O4 + delta_angle);
    this.customrod($V([0,0]), $V([O4C,0]), 0.2);
    this.point($V([0,0]));
    this.point($V([O4C,0]));
    this.restore();

    //Extended ROCKER BAR parallel
    this.save();
    this.translate($V([-O6O4,0]));
    this.rotate(ref_angle-O4 + delta_angle);
    this.rod($V([0,0]), $V([O6D,0]), 0.2);
    this.point($V([0,0]));
    this.point($V([O6D,0]));
    this.restore();

    //delta angle labelling
    if(this.getOption("delta_label"))
    {
        this.save();
        this.rotate(ref_angle-O4);
        this.setProp("arrowLineWidthPx", 2);
        this.setProp("shapeOutlineColor", "red");
        this.setProp("shapeStrokePattern", "dashed");
        this.line($V([-BO4+1,0]), $V([1.5,0]));
        this.rotate(delta_angle);
        this.line($V([0,0]), $V([1.5,0]));
        this.rotate(-delta_angle);
        this.circleArrow($V([0,0]), 1.4, 0, delta_angle);
        this._ctx.font = "15px Arial";
        this.labelCircleLine($V([0,0]), 1.4, 0, delta_angle, $V([1, 3]), `δ = ${Math.round(delta_angle*(180/Math.PI))}º`, true);
        this.restore();
    }

    //VELOCITY AND ACCELERATION
    
    //for motor bar
    var computeMotor = function(t) {
        teta =  O2 + omega*(t-time);
        var dataNow = {};
        dataNow.A = this.vector2DAtAngle(ref_angle + teta).x(O2A);
        return dataNow;
    }
    var dataMotor = this.numDiff(computeMotor.bind(this), t);

    //for wiper bar
    var computeWiper = function(t) {
        //this is a function with it's own calculation by changing t by eps amt. So, no recurssive def will work. It's NOT a loop!
        teta =  O2 + omega*(t-time);
        AO4 = Math.sqrt(O2A*O2A + O4O2*O4O2 - 2*O2A*O4O2*Math.cos(teta));
        B = Math.acos((BO4*BO4 + AB*AB - AO4*AO4)/(2*BO4*AB));
        O4 = Math.asin(O2A * Math.sin(teta) / AO4) + Math.asin(AB * Math.sin(B) / AO4);
        A = 2*Math.PI - B - O4 - O2;

        var dataNow = {};
        dataNow.C = this.vector2DAtAngle(ref_angle-O4 + delta_angle).x(O4C);
        return dataNow;
    }
    var dataWiper = this.numDiff(computeWiper.bind(this), t);

    document.getElementById('speed_val').innerHTML = `${dataWiper.diff.C.modulus().toFixed(2)} m/s`;
    document.getElementById('acc_val').innerHTML = `${dataWiper.ddiff.C.modulus().toFixed(1)} m/s<sup>2</sup>`;            

    //scaling factor to scale down vel and acc magnitude as arrows get too big!!
    var scaling_factor = 3; 

    //velocity vector for motor
    this.save();
        this.translate(pivot_motor);
        this.arrow(dataMotor.A, dataMotor.A.add(dataMotor.diff.A.x(1/scaling_factor)), "velocity");
    this.restore();

    if (this.getOption("velocity")) {
        
        //velocity vector for wiper
        this.save();
            this.translate(pivot_right);
            this.arrow(dataWiper.C, dataWiper.C.add(dataWiper.diff.C.x(1/scaling_factor)), "velocity");
        this.restore();                
    }

    if (this.getOption("acceleration")) {
        // //acceleration vector for motor
        // this.save();
        //     this.translate(pivot_motor);
        //     this.arrow(dataMotor.A, dataMotor.A.add(dataMotor.ddiff.A.x(1/scaling_factor)), "acceleration");
        // this.restore();

        //acceleration vector for wiper
        this.save();
            this.translate(pivot_right);
            //net acc
            this.arrow(dataWiper.C, dataWiper.C.add(dataWiper.ddiff.C.x(1/scaling_factor)), "rotation");

            var unit_vec_O4C = dataWiper.C.x(1/O4C);
            this.save();
            this.setProp("arrowLineWidthPx", 1.5);
            //centripetal acc
            this.arrow(dataWiper.C, dataWiper.C.x((O4C + dataWiper.ddiff.C.x(1/scaling_factor).dot(unit_vec_O4C))/O4C), "acceleration");
            //tangential acc
            this.arrow(dataWiper.C, dataWiper.C.add(dataWiper.ddiff.C.x(1/scaling_factor).subtract(unit_vec_O4C.x(dataWiper.ddiff.C.x(1/scaling_factor).dot(unit_vec_O4C)))), "acceleration");
            this.restore();
        this.restore();
    }

    document.getElementById('cent_val').innerHTML = `${Math.abs(dataWiper.ddiff.C.dot(dataWiper.C.x(1/O4C)).toFixed(1))} m/s<sup>2</sup>`;
    document.getElementById('tan_val').innerHTML = `${dataWiper.ddiff.C.subtract(dataWiper.C.x(1/O4C).x(dataWiper.ddiff.C.dot(dataWiper.C.x(1/O4C)))).modulus().toFixed(1)} m/s<sup>2</sup>`;


    var maxtime = 10; 
    
    if( Math.round(dataWiper.diff.C.modulus()) >= speedMax)
    {
        speedMax = Math.round(dataWiper.diff.C.modulus());
    }
    if( Math.round(dataWiper.ddiff.C.modulus()) >= accMax)
    {
        accMax = Math.round(dataWiper.ddiff.C.modulus());
    }
    
    var speedHistory = this.history("speed", 0.04, maxtime, t, dataWiper.diff.C.modulus().toFixed(2));            
    var accHistory = this.history("acc", 0.04, maxtime, t, dataWiper.ddiff.C.modulus().toFixed(1));

    this.plotHistory($V([-4.6, -5.5]), $V([9.5, 2]), $V([maxtime, 1.5 * speedMax]), Math.min(t, 0.95 * maxtime), "|v|", speedHistory, "velocity");
    this.plotHistory($V([-4.6, -8.2]), $V([9.5, 2]), $V([maxtime, 1.5 * accMax]), Math.min(t, 0.95 * maxtime), "|a|", accHistory, "rotation");            
   
    temp_time++;
    time = t;
});

function update_butt()
{
    var anim_butt = document.getElementById("animation");
    if(animPD._running)
    {
        anim_butt.innerHTML = "Stop animation";
        anim_butt.classList = "btn btn-danger w-50 my-2 mx-2";
    }
    else{
        anim_butt.innerHTML = "Start animation";
        anim_butt.classList = "btn btn-success w-50 my-2 mx-2";
    }
}

function update_vec_butt(idname)
{
    var butt = document.getElementById(idname);
    var text = butt.innerHTML;
    if(text.slice(0,4) == "Show")
    {
        butt.innerHTML = "Hide" + text.slice(4); 
    }
    else
    {
        butt.innerHTML = "Show" + text.slice(4);
    }
}

function reset ()
{
    animPD.stopAnim();
    update_butt();
    animPD.reset();
    animPD.startAnim();
    animPD.stopAnim();

    temp_time = 0;
    time = 0; 
    flag = 0;
    O2 = 0;
    teta = 0;
    path_points_above = [];
    path_points_below = [];
    maxO4 = 0;
    minO4 = 0;
    speedMax = 0;
    accMax =0;

    omega = 2;
    delta_angle = (Math.PI/180)*10;
    length_motor_bar = 0.6;
    length_coupler_bar = 2.8;
    length_rocker_bar = 1.6;
    length_rocker_bar_ext = 4;

    document.getElementById('omegaslider').value = omega;
    document.getElementById("w_val").innerHTML = `${omega} rad/s`;

    document.getElementById('delta').value = delta_angle*(180/Math.PI);
    document.getElementById("delta_val").innerHTML = `${Math.round(delta_angle*(180/Math.PI))}º`;

    document.getElementById('motor_bar').value = length_motor_bar;
    document.getElementById("motor_bar_val").innerHTML = `${length_motor_bar} m`;

    document.getElementById('coupler_bar').value = length_coupler_bar;
    document.getElementById("coupler_bar_val").innerHTML = `${length_coupler_bar} m`;

    document.getElementById('output_bar').value = length_rocker_bar;
    document.getElementById("output_bar_val").innerHTML = `${length_rocker_bar} m`;

    document.getElementById('wiper_bar').value = length_rocker_bar_ext;
    document.getElementById("wiper_bar_val").innerHTML = `${length_rocker_bar_ext} m`;
}

function setOmega(value){
    temp_time = 0;
    speedMax = 0;
    accMax =0;

    path_points_above = [];
    path_points_below = [];
    if(!animPD._running){
        animPD.startAnim();
        omega = document.getElementById('omegaslider').value;
        document.getElementById("w_val").innerHTML = `${omega} rad/s`;
        animPD.stopAnim();
    }
    else{
        omega = document.getElementById('omegaslider').value;
        document.getElementById("w_val").innerHTML = `${omega} rad/s`;
    }
}

function setdelta(value){
    temp_time = 0;
    maxO4 = 0;
    minO4 = 0;
    speedMax = 0;
    accMax =0;

    path_points_above = [];
    path_points_below = [];
    if(!animPD._running){
        animPD.startAnim();
        delta_angle = document.getElementById('delta').value*(Math.PI/180);
        document.getElementById("delta_val").innerHTML = `${Math.round(delta_angle*(180/Math.PI))}º`;
        animPD.stopAnim();
    }
    else{
        delta_angle = document.getElementById('delta').value*(Math.PI/180);
        document.getElementById("delta_val").innerHTML = `${Math.round(delta_angle*(180/Math.PI))}º`;
    }
}

function setmotor(value){
    temp_time = 0;
    maxO4 = 0;
    minO4 = 0;
    speedMax = 0;
    accMax =0;

    path_points_above = [];
    path_points_below = [];
    if(!animPD._running){
        animPD.startAnim();
        length_motor_bar = document.getElementById('motor_bar').value;
        document.getElementById("motor_bar_val").innerHTML = `${length_motor_bar} m`;
        animPD.stopAnim();
    }
    else{
        length_motor_bar = document.getElementById('motor_bar').value;
        document.getElementById("motor_bar_val").innerHTML = `${length_motor_bar} m`;
    }
}
function setcoupler(value){
    temp_time = 0;
    maxO4 = 0;
    minO4 = 0;
    speedMax = 0;
    accMax =0;

    path_points_above = [];
    path_points_below = [];
    if(!animPD._running){
        animPD.startAnim();
        length_coupler_bar = document.getElementById('coupler_bar').value;
        document.getElementById("coupler_bar_val").innerHTML = `${length_coupler_bar} m`;
        animPD.stopAnim();
    }
    else{
        length_coupler_bar = document.getElementById('coupler_bar').value;
        document.getElementById("coupler_bar_val").innerHTML = `${length_coupler_bar} m`;
    }
}
function setoutput(value){
    temp_time = 0;
    maxO4 = 0;
    minO4 = 0;
    speedMax = 0;
    accMax =0;

    path_points_above = [];
    path_points_below = [];
    if(!animPD._running){
        animPD.startAnim();
        length_rocker_bar = document.getElementById('output_bar').value;
        document.getElementById("output_bar_val").innerHTML = `${length_rocker_bar} m`;
        animPD.stopAnim();
    }
    else{
        length_rocker_bar = document.getElementById('output_bar').value;
        document.getElementById("output_bar_val").innerHTML = `${length_rocker_bar} m`;
    }
}

function setwiper(){
    temp_time = 0;
    maxO4 = 0;
    minO4 = 0;
    speedMax = 0;
    accMax =0;

    path_points_above = [];
    path_points_below = [];
    if(!animPD._running){
        animPD.startAnim();
        length_rocker_bar_ext = document.getElementById('wiper_bar').value;
        document.getElementById("wiper_bar_val").innerHTML = `${length_rocker_bar_ext} m`;
        animPD.stopAnim();
    }
    else{
        length_rocker_bar_ext = document.getElementById('wiper_bar').value;
        document.getElementById("wiper_bar_val").innerHTML = `${length_rocker_bar_ext} m`;
    }
}
