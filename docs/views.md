# Instance views

Zeno Views are modular renderers for different data types and tasks.
Each View is a Python package that can be installed and passed as the `view` option to a TOML configuration file.

```{list-table}
:header-rows: 1

* - View Name
  - Description
* - `zenoml-image-classification`
  - Display images with ground truth and predicted class labels.
	Works for both binary and multiclass classification.

	Requires image inputs and text or numeric outputs.
* - `zenoml-text-classification`
  - Display text with ground truth and predicted class labels.
	Works for both binary and multiclass classification.

	Requires text inputs and text or numeric outputs.
* - `zenoml-audio-transcription`
  - Display audio file along with outputed text, e.g. transcription.

	Requires audio inputs and text outputs.
* - `zenoml-image-object-detection`
  - Display image with overlayed ground truth and predicted rectangular bounding boxes.

	Requires image inputs and output bounding boxes as an array of boxes in the format [x, y, width, height].
* - `zenoml-image-segmentation`
  - Display image with overlayed ground truth and predicted segmentation masks.
	Works for both binary segmentation.

	Requires image inputs and binary image outputs.
```
