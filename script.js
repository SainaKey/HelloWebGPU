onload = async function(){

    const vertWGSL = `
    @vertex
    fn main(
      @builtin(vertex_index) VertexIndex : u32
    ) -> @builtin(position) vec4<f32> {
    
      var pos = array<vec2<f32>, 3>(
        vec2<f32>(0.0, 0.5),
        vec2<f32>(-0.5, -0.5),
        vec2<f32>(0.5, -0.5)
      );
    
      return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
    }
    `;
    
    const fragWGSL = `
    @fragment
    fn main() -> @location(0) vec4<f32> {
      return vec4<f32>(1.0, 0.0, 0.0, 1.0);
    }
    `;
    
    var c = document.getElementById('canvas');
    c.width = 500;
    c.height = 300;
    // webgpuコンテキストの取得
    const context = c.getContext('webgpu');

    // deviceの取得
    const g_adapter = await navigator.gpu.requestAdapter();
    g_adapter = await navigator.gpu.requestAdapter();
    const g_device = await g_adapter.requestDevice();

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device: g_device,
    format: presentationFormat,
    alphaMode: 'opaque', // or 'premultiplied'
  });

   // create a render pipeline
   const pipeline = g_device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: g_device.createShaderModule({
        code: vertWGSL,
      }),
      entryPoint: 'main',
    },
    fragment: {
      module: g_device.createShaderModule({
        code: fragWGSL,
      }),
      entryPoint: 'main',
      targets: [
        // 0
        { // @location(0) in fragment shader
          format: presentationFormat,
        },
      ],
    },
    primitive: {
      topology: 'triangle-list',
    },
  });

  // 恒常ループ
  (function(){

    const commandEncoder = g_device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();
    const renderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    };
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
  
    //プリミティブを描画する。詳細な仕様は，[[#rendering-operations]]を参照してください．
    // param vertexCount - 描画する頂点の数．
    // param instanceCount - 描画するインスタンスの数．
    // param firstVertex - 描画を開始する頂点バッファ内のオフセット（頂点単位）．
    // param firstInstance - 描画する最初のインスタンス．
    passEncoder.draw(3, 1, 0, 0);
    // レンダーパスコマンドシーケンスの記録を完了する。
    passEncoder.end();
  
    g_device.queue.submit([commandEncoder.finish()]);

    // ループのために再帰呼び出し
    setTimeout(arguments.callee, 1000 / 30);
})();

};