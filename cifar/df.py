import os
import pandas as pd
base_path = './cif/test/'
files = os.listdir(base_path)
out = []
for folder in files:
    for image in os.listdir(os.path.join(base_path, folder)):
        out.append(
            (
                os.path.join(folder, image),
                folder,
            ))
df = pd.DataFrame(out, columns=['id', 'label'])

print(df.head())
df.to_csv('cifar_pred.csv')
