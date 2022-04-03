import argparse
from multiprocessing import Pipe, Process
from pathlib import Path

from .server import run_background_processor, run_server

TASK_TYPES = [
    "image-classification",
    "object-detection",
    "text-classification",
    "audio-classification",
]


def __create_parser():
    parser = argparse.ArgumentParser(description="Evaluate ML systems.")
    parser.add_argument(
        "test-files",
        metavar="test_files",
        nargs="+",
        type=Path,
        help="Directory or Python files with annotated functions"
        + "such as slicers and metrics.",
    )
    parser.add_argument(
        "--task",
        nargs=1,
        choices=TASK_TYPES,
        type=str,
        help="The type of task to be analyzed.",
    )
    parser.add_argument(
        "--metadata",
        nargs=1,
        type=Path,
        help="CSV or Parquet file with metadata for each instance,"
        + " at minimum a column with file names.",
    )
    parser.add_argument(
        "--data-path",
        dest="data_path",
        nargs="?",
        type=Path,
        default="",
        help="Folder with data instances identified"
        + "by the id-column option in the metadata file.",
    )
    parser.add_argument(
        "--models",
        dest="models",
        type=Path,
        nargs="+",
        help="Paths to models for testing",
    )
    parser.add_argument(
        "--id-column",
        dest="id_column",
        default="id",
        type=str,
        nargs="?",
        help="Column with the ID used retrieve data files AND for caching",
    )
    parser.add_argument(
        "--label-column",
        dest="label_column",
        default="label",
        type=str,
        nargs="?",
        help="Column with the ground truth label for instances.",
    )
    parser.add_argument(
        "--batch-size",
        dest="batch_size",
        nargs="?",
        default=64,
        type=int,
        help="Batch size of passed model predictions",
    )
    parser.add_argument(
        "--cache-path",
        dest="cache_path",
        nargs="?",
        type=Path,
        default="./.zeno_cache/",
        help="Folder for caching results of slicers and metrics.",
    )
    parser.add_argument(
        "--port",
        dest="port",
        nargs="?",
        type=int,
        default=8000,
        help="IP port to run Zeno on.",
    )
    return parser


def main():
    parser = __create_parser()
    args = parser.parse_args()

    server_conn, processor_conn = Pipe()

    server_process = Process(target=run_server, args=(server_conn, args))
    background_process = Process(
        target=run_background_processor,
        args=(
            processor_conn,
            args,
        ),
    )

    server_process.start()
    background_process.start()

    server_process.join()
