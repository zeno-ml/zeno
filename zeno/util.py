from watchdog.events import FileSystemEventHandler
import os


def cached_model_builder(
    model_name, cache, loaded_models, model_predictor, batch_size, idx, data_path
):
    def cached_model(instances):
        outputs = [None] * len(instances)
        to_predict = []
        predicted = []

        # Get all instances from cache possible
        for i, inst in enumerate(instances[idx].to_list()):
            if inst in cache:
                outputs[i] = cache.get(inst)
            else:
                if data_path:
                    to_predict.append(os.path.join(data_path, inst))
                else:
                    to_predict.append(inst)

        if len(to_predict) > 0:
            if len(to_predict) < batch_size:
                predicted = model_predictor(loaded_models[model_name], to_predict)
            else:
                for i in range(0, len(to_predict), batch_size):
                    predicted.extend(
                        model_predictor(
                            loaded_models[model_name], to_predict[i : i + batch_size]
                        )
                    )

            j = 0
            for i, inst in enumerate(outputs):
                if inst is None:
                    outputs[i] = predicted[j]
                    cache[instances.iloc[i][idx]] = outputs[i]
                    j = j + 1

        return outputs

    return cached_model


class TestFileUpdateHandler(FileSystemEventHandler):
    def __init__(self, files, callback):
        self.files = files
        self.callback = callback

    def on_modified(self, event):
        if os.path.abspath(event.src_path) in self.files:
            self.callback()
