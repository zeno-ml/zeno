from zeno import __create_parser, run_zeno  # type: ignore


def main():
    parser = __create_parser()
    args = parser.parse_args(
        [
            "preprocess",
            "--tests",
            "./examples/cifar",
            "--task",
            "image-classification",
            "--metadata",
            "./examples/models/cifar/cifar_pred.csv",
            "--models",
            "./examples/models/cifar/cifar_net_1.pth",
            "./examples/models/cifar/cifar_net_2.pth",
            "./examples/models/cifar/cifar_net_5.pth",
            "./examples/models/cifar/cifar_net_10.pth",
            "--data-path",
            "~/dev/data/cifar/test/",
        ]
    )
    run_zeno(args)


if __name__ == "__main__":
    main()
