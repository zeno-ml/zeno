import argparse
from multiprocessing import Manager, Pipe, Process

from .server import run_background_processor, run_server

parser = argparse.ArgumentParser()
parser.add_argument(
    "--test-files",
    dest="test_files",
    nargs="+",
    help="Python files with slicers or testers",
)
parser.add_argument(
    "--models", dest="models", nargs="+", help="Paths or names of models"
)
parser.add_argument("--metadata", dest="metadata", nargs=1, help="Csv of metadata")
parser.add_argument(
    "--data-path", dest="data_path", nargs="?", default="", help="Filepath of files"
)
parser.add_argument(
    "--cache-path",
    dest="cache_path",
    nargs="?",
    default="./.zeno_cache/",
    help="Desination folder for cache files",
)
parser.add_argument(
    "--id-column",
    dest="id_column",
    default="id",
    nargs="?",
    help="Column with ID to retrieve data files AND use for caching",
)
parser.add_argument(
    "--batch-size",
    dest="batch_size",
    nargs="?",
    default=64,
    type=int,
    help="Batch size for predictions",
)


def main():
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
