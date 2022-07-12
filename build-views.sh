# Build the frontends for all the view packages.
build_func(){
	cd $1/frontend;
	npm i;
	npm run build;

}
for f in views/*; do
  if [ -d $f ] && [ $f != "views/template" ]; then
	build_func $f &
  fi
done

wait