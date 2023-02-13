from typing import Callable
from zeno import inference
import gradio as gr


@inference
def gradio_inference(model_fn: Callable, model_names):
    return gr.Interface(
        fn=model_fn,
        inputs=[gr.components.Dropdown(model_names), gr.Image(type="filepath")],
        outputs=gr.Text(label="Output"),
        allow_flagging="never",
    )
