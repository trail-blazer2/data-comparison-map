class Globe3D {
  constructor(canvasId, geoData) {
    const canvas = canvasElement;
    const ctx = canvas.getContext('webgl'); // or '2d' depending on your script
    this.canvas = document.getElementById(canvasId);
    this.context = this.canvas.getContext("2d");
    this.geoData = geoData;
    
    // Set up 3D Orthographic Projection
    this.projection = d3.geoOrthographic()
      .scale(250)
      .translate([this.canvas.width / 2, this.canvas.height / 2])
      .clipAngle(90); // Hides the back of the globe
      
    this.path = d3.geoPath().projection(this.projection).context(this.context);
    
    // Initial rotation state
    this.v0 = null;
    this.r0 = null;
    this.q0 = null;

    this.initDrag();
    this.draw();
  }

  draw() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Ocean (Background sphere)
    this.context.beginPath();
    this.path({type: "Sphere"});
    this.context.fillStyle = "#dbeafe";
    this.context.fill();
    this.context.lineWidth = 1;
    this.context.strokeStyle = "#8395a7";
    this.context.stroke();

    // Draw Countries
    this.context.beginPath();
    this.path(this.geoData); // geoData should be your FeatureCollection
    this.context.fillStyle = "#849BBA";
    this.context.fill();
    this.context.lineWidth = 0.5;
    this.context.strokeStyle = "#fff";
    this.context.stroke();
  }

  initDrag() {
    const drag = d3.drag()
      .on("start", (e) => {
        this.v0 = this.versor(this.projection.invert([e.x, e.y]));
        this.q0 = this.versor(this.projection.rotate());
      })
      .on("drag", (e) => {
        const v1 = this.versor(this.projection.invert([e.x, e.y]));
        const q1 = this.multiply(this.q0, this.delta(this.v0, v1));
        this.projection.rotate(this.rotation(q1));
        this.draw();
      });

    d3.select(this.canvas).call(drag);
  }

  // --- Versor Math for smooth 3D dragging ---
  versor(c) {
    const lon = c[0] * Math.PI / 180, lat = c[1] * Math.PI / 180;
    return [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
  }
  multiply(q0, q1) {
    return [
      q0[0] * q1[0] - q0[1] * q1[1] - q0[2] * q1[2] - q0[3] * q1[3],
      q0[0] * q1[1] + q0[1] * q1[0] + q0[2] * q1[3] - q0[3] * q1[2],
      q0[0] * q1[2] - q0[1] * q1[3] + q0[2] * q1[0] + q0[3] * q1[1],
      q0[0] * q1[3] + q0[1] * q1[2] - q0[2] * q1[1] + q0[3] * q1[0]
    ];
  }
  delta(v0, v1) {
    const w = [v0[1] * v1[2] - v0[2] * v1[1], v0[2] * v1[0] - v0[0] * v1[2], v0[0] * v1[1] - v0[1] * v1[0]];
    const l = Math.sqrt(w[0] * w[0] + w[1] * w[1] + w[2] * w[2]);
    if (!l) return [1, 0, 0, 0];
    const a = Math.acos(Math.max(-1, Math.min(1, v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2]))) / 2;
    const s = Math.sin(a) / l;
    return [Math.cos(a), w[0] * s, w[1] * s, w[2] * s];
  }
  rotation(q) {
    return [
      Math.atan2(2 * (q[0] * q[1] + q[2] * q[3]), 1 - 2 * (q[1] * q[1] + q[2] * q[2])) * 180 / Math.PI,
      Math.asin(Math.max(-1, Math.min(1, 2 * (q[0] * q[2] - q[3] * q[1])))) * 180 / Math.PI,
      Math.atan2(2 * (q[0] * q[3] + q[1] * q[2]), 1 - 2 * (q[2] * q[2] + q[3] * q[3])) * 180 / Math.PI
    ];
  }
}
