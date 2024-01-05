import { useTranslation } from 'react-i18next';

export const handle = {
  i18nNamespaces: ['common'],
};

export default function About() {
  const { t } = useTranslation(handle.i18nNamespaces);

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('about.page-title')}
      </h1>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu tempor est. Maecenas vitae urna quis mauris tristique dapibus et nec diam. Morbi vulputate sollicitudin justo ut tempor. Aliquam aliquam condimentum dolor ut tincidunt. Duis at
        mattis lacus. Praesent rhoncus ipsum sit amet eros semper, et accumsan nibh consequat. Nulla pretium leo et purus dapibus, a molestie nunc dignissim. Donec at tincidunt velit, id iaculis nunc. In vitae aliquam velit, nec vulputate nisi. Vestibulum
        in metus quis lacus facilisis sodales in at ligula. Donec et lacus sit amet magna efficitur ornare. Phasellus sem enim, ullamcorper eu porta et, egestas nec massa. Aenean sollicitudin, eros sed facilisis imperdiet, leo magna gravida felis, ac
        consequat lorem mi et urna. Aliquam accumsan sem eget justo pharetra, nec ullamcorper nunc laoreet.
      </p>
      <p>
        Pellentesque dictum ligula diam, et sollicitudin dolor consectetur a. Duis ut massa gravida, volutpat turpis quis, viverra nunc. Donec fermentum placerat velit vitae fringilla. Duis lacus lorem, pulvinar sed erat ut, porta feugiat orci. In non
        sapien tristique, euismod turpis id, dignissim mauris. Mauris justo lectus, cursus vitae nisl vitae, gravida vulputate ex. Fusce gravida dolor at elit malesuada, et interdum risus suscipit. Donec ut imperdiet est, nec sollicitudin nisl. Vivamus
        eros mi, dictum sed tincidunt ac, gravida ac ligula.
      </p>
    </>
  );
}
