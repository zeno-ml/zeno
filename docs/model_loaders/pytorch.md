# Pytorch Loader

PyTorch model loader for image models using PIL image inputs:

```python
T = transforms.Compose([transforms.ToTensor()])

@load_model
def load_model(model_path):
    # Load the saved weights for a defined model
    net = Net()
    net.load_state_dict(torch.load(model_path))

    # Given PIL images, return predictions
    def pred(instances):
        imgs = torch.stack([T(img) for img in instances])
        with torch.no_grad():
            out = net(imgs)
        return [i for i in torch.argmax(out, dim=1).detach().numpy()]

    return pred
```
