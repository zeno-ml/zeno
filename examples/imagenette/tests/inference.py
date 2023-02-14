from zeno import inference, ZenoOptions
import gradio as gr


@inference
def gradio_inference(ops: ZenoOptions):
    return (
        [gr.Image(type="filepath")],
        gr.Text(label="Output"),
        [ops.data_column],
    )
