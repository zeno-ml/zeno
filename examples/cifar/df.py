import os
import pandas as pd

base_path = "../../data/CIFAR-10-images/test/"
files = os.listdir(base_path)
out = []
for folder in files:
    for image in os.listdir(os.path.join(base_path, folder)):
        out.append(
            (
                os.path.join(folder, image),
                folder,
            )
        )
df = pd.DataFrame(out, columns=["id", "label"])

df.to_csv("cifar_pred.csv", index=False)

df_mini = df.sample(1000)
df_mini.to_csv("cifar_mini.csv", index=False)
