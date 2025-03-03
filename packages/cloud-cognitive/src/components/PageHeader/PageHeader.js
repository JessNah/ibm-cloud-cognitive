//
// Copyright IBM Corp. 2020, 2021
//
// This source code is licensed under the Apache-2.0 license found in the
// LICENSE file in the root directory of this source tree.
//

import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { layout05, baseFontSize } from '@carbon/layout';
import cx from 'classnames';
import { useResizeDetector } from 'react-resize-detector';

import {
  BreadcrumbItem,
  Grid,
  Column,
  Row,
  Button,
  SkeletonText,
  Tag,
} from 'carbon-components-react';

import { useWindowResize, useNearestScroll } from '../../global/js/hooks';
import { getDevtoolsProps } from '../../global/js/utils/devtools';

import {
  deprecateProp,
  deprecatePropUsage,
  extractShapesArray,
  prepareProps,
} from '../../global/js/utils/props-helper';

import { pkg } from '../../settings';

import { ActionBar } from '../ActionBar/';
import { BreadcrumbWithOverflow } from '../BreadcrumbWithOverflow';
import { TagSet, string_required_if_more_than_10_tags } from '../TagSet/TagSet';
import { ButtonSetWithOverflow } from '../ButtonSetWithOverflow';
import { ChevronUp16 } from '@carbon/icons-react';

const componentName = 'PageHeader';

import {
  blockClass,
  utilCheckUpdateVerticalSpace,
  utilGetTitleShape,
  utilSetCollapsed,
} from './PageHeaderUtils';

export let PageHeader = React.forwardRef(
  (
    {
      actionBarItems,
      actionBarOverflowAriaLabel,
      actionBarOverflowLabel: deprecated_actionBarOverflowLabel,
      allTagsModalSearchLabel,
      allTagsModalSearchPlaceholderText,
      allTagsModalTitle,
      availableSpace: deprecated_availableSpace,
      background: deprecated_background,
      hasBackgroundAlways,
      breadcrumbOverflowAriaLabel,
      breadcrumbOverflowLabel: deprecated_breadcrumbOverflowLabel,
      breadcrumbItems: deprecated_breadcrumbItems,
      breadcrumbs: breadcrumbsIn,
      children,
      className,
      collapseHeader,
      collapseHeaderIconDescription,
      collapseHeaderLabel: deprecated_collapseHeaderLabel,
      collapseHeaderToggleWanted: deprecated_collapseHeaderToggleWanted,
      collapseTitle,
      disableBreadcrumbScroll,
      expandHeaderIconDescription,
      expandHeaderLabel: deprecated_expandHeaderLabel,
      fullWidthGrid,
      hasCollapseHeaderToggle,
      narrowGrid,
      navigation,
      pageActions,
      pageActionsOverflowLabel,
      pageHeaderOffset: _deprecated_pageHeaderOffset,
      preCollapseTitleRow: deprecated_preCollapseTitleRow,
      preventBreadcrumbScroll: deprecated_preventBreadcrumbScroll,
      showAllTagsLabel,
      subtitle,
      tags,
      title,
      titleIcon,
      ...rest
    },
    ref
  ) => {
    // handle deprecated props - START
    actionBarOverflowAriaLabel ??= deprecated_actionBarOverflowLabel;
    breadcrumbOverflowAriaLabel ??= deprecated_breadcrumbOverflowLabel;
    children ??= deprecated_availableSpace;
    collapseHeaderIconDescription ??= deprecated_collapseHeaderLabel;
    expandHeaderIconDescription ??= deprecated_expandHeaderLabel;
    hasBackgroundAlways ??= deprecated_background;
    hasCollapseHeaderToggle ??= deprecated_collapseHeaderToggleWanted;
    collapseTitle ??= deprecated_preCollapseTitleRow;
    disableBreadcrumbScroll ??= deprecated_preventBreadcrumbScroll;
    const breadcrumbs = breadcrumbsIn ?? deprecated_breadcrumbItems;
    // handle deprecated props - END

    const [metrics, setMetrics] = useState({});
    const [pageHeaderStyles, setPageHeaderStyles] = useState({
      ...rest.style,
    });

    // refs
    const localHeaderRef = useRef(null);
    const headerRef = ref || localHeaderRef;
    const sizingContainerRef = useRef();
    const offsetTopMeasuringRef = useRef(null);

    // utility functions
    // Title shape is used to allow title to be string or shape
    const getTitleShape = () =>
      utilGetTitleShape(title, titleIcon, PageHeader.defaultProps.title);
    const checkUpdateVerticalSpace = function () {
      return utilCheckUpdateVerticalSpace(
        headerRef,
        offsetTopMeasuringRef,
        navigation,
        disableBreadcrumbScroll,
        setMetrics
      );
    };

    // state based on props only
    const actionBarItemArray = extractShapesArray(actionBarItems);
    const hasActionBar = actionBarItemArray && actionBarItemArray.length;
    const hasBreadcrumbRow = !(
      breadcrumbs === undefined && actionBarItems === undefined
    );
    const pageActionsItemArray = extractShapesArray(pageActions)?.map(
      (shape) => ({
        label: shape.children,
        ...shape,
      })
    );

    /* Title shape is used to allow title to be string or shape */
    const titleShape = getTitleShape();

    // NOTE: The buffer is used to add space between the bottom of the header and the last content
    // Not pre-collapsed and (subtitle or children)
    const lastRowBufferActive =
      ((title || pageActions) && !collapseTitle) || subtitle || children;

    // state based on scroll/resize based effects
    const [pageActionsInBreadcrumbRow, setPageActionsInBreadcrumbRow] =
      useState(false);
    const [scrollYValue, setScrollYValue] = useState(0);
    const [backgroundOpacity, setBackgroundOpacity] = useState(0);
    const [hasCollapseButton, setHasCollapseButton] = useState(false);
    const [spaceForCollapseButton, setSpaceForCollapseButton] = useState(false);
    const [actionBarMaxWidth, setActionBarMaxWidth] = useState(0);
    const [actionBarMinWidth, setActionBarMinWidth] = useState(0);
    const [pageActionInBreadcrumbMaxWidth, setPageActionInBreadcrumbMaxWidth] =
      useState(0);
    const [pageActionInBreadcrumbMinWidth, setPageActionInBreadcrumbMinWidth] =
      useState(0);
    const [actionBarColumnWidth, setActionBarColumnWidth] = useState(0);
    const [fullyCollapsed, setFullyCollapsed] = useState(false);

    // handlers
    const handleActionBarWidthChange = ({ minWidth, maxWidth }) => {
      /* don't know how to test resize */
      /* istanbul ignore next */
      setActionBarMaxWidth(maxWidth);
      /* don't know how to test resize */
      /* istanbul ignore next */
      setActionBarMinWidth(minWidth);
    };

    const handleButtonSetWidthChange = ({ minWidth, maxWidth }) => {
      /* don't know how to test resize */
      /* istanbul ignore next */
      setPageActionInBreadcrumbMaxWidth(maxWidth);
      /* don't know how to test resize */
      /* istanbul ignore next */
      setPageActionInBreadcrumbMinWidth(minWidth);
    };

    /* istanbul ignore next */
    const handleResizeActionBarColumn = (width) => {
      /* don't know how to test resize */
      /* istanbul ignore next */
      setActionBarColumnWidth(width);
    };

    /* istanbul ignore next */
    const handleResize = () => {
      // receives width and height parameters if needed
      /* don't know how to test resize */
      /* istanbul ignore next */
      checkUpdateVerticalSpace();
    };

    const handleCollapseToggle = () => {
      utilSetCollapsed(
        !fullyCollapsed,
        metrics.headerOffset,
        metrics.headerTopValue
      );
    };

    // use effects
    useEffect(() => {
      // Determine the location of the pageAction buttons
      /* istanbul ignore next */
      setPageActionsInBreadcrumbRow(
        collapseTitle ||
          (scrollYValue > metrics.titleRowSpaceAbove && hasActionBar)
      );
    }, [
      hasActionBar,
      metrics.breadcrumbRowSpaceBelow,
      metrics.titleRowSpaceAbove,
      collapseTitle,
      scrollYValue,
    ]);

    useEffect(() => {
      let newActionBarWidth = 'initial';
      let newPageActionInBreadcrumbWidth = 'initial';

      /* don't know how to test resize */
      /* istanbul ignore if */
      if (actionBarColumnWidth > 0) {
        if (
          pageActionInBreadcrumbMaxWidth > 0 &&
          actionBarColumnWidth >
            actionBarMaxWidth + pageActionInBreadcrumbMaxWidth
        ) {
          newPageActionInBreadcrumbWidth = `${pageActionInBreadcrumbMaxWidth}px`;
        } else if (pageActionInBreadcrumbMinWidth > 0) {
          newPageActionInBreadcrumbWidth = `${pageActionInBreadcrumbMinWidth}px`;
        }

        if (
          actionBarMaxWidth > 0 &&
          actionBarColumnWidth >
            pageActionInBreadcrumbMinWidth + actionBarMaxWidth
        ) {
          newActionBarWidth = `${actionBarMaxWidth}px`;
        } else {
          if (actionBarMinWidth > 0) {
            newActionBarWidth = `${
              actionBarColumnWidth - pageActionInBreadcrumbMinWidth
            }px`;
          }
        }
      }

      setPageHeaderStyles((prev) => ({
        ...prev,
        [`--${blockClass}--max-action-bar-width-px`]: newActionBarWidth,
        [`--${blockClass}--button-set-in-breadcrumb-width-px`]: `${newPageActionInBreadcrumbWidth}`,
      }));
    }, [
      actionBarColumnWidth,
      actionBarMaxWidth,
      actionBarMinWidth,
      pageActionInBreadcrumbMaxWidth,
      pageActionInBreadcrumbMinWidth,
      headerRef,
    ]);

    useEffect(() => {
      // Updates custom CSS props used to manage scroll behaviour
      /* istanbul ignore next */
      setPageHeaderStyles((prev) => ({
        ...prev,
        [`--${blockClass}--height-px`]: `${metrics.headerHeight}px`,
        [`--${blockClass}--width-px`]: `${metrics.headerWidth}px`,
        [`--${blockClass}--header-top`]: `${
          metrics.headerTopValue + metrics.headerOffset
        }px`,
        [`--${blockClass}--breadcrumb-title-visibility`]:
          scrollYValue > 0 ? 'visible' : 'hidden',
        [`--${blockClass}--scroll`]: `${scrollYValue}`,
        [`--${blockClass}--breadcrumb-title-top`]: `${Math.max(
          0,
          metrics.breadcrumbTitleHeight +
            metrics.titleRowSpaceAbove -
            scrollYValue
        )}px`,
        [`--${blockClass}--breadcrumb-title-opacity`]: `${Math.min(
          1,
          Math.max(
            0,
            (scrollYValue - (metrics.titleRowSpaceAbove || 0)) /
              (metrics.breadcrumbTitleHeight || 1) // don't want to divide by zero
          )
        )}`,
        [`--${blockClass}--breadcrumb-row-width-px`]: `${metrics.breadcrumbRowWidth}px`,
      }));
    }, [
      headerRef,
      disableBreadcrumbScroll,
      metrics,
      metrics.breadcrumbRowHeight,
      metrics.breadcrumbRowSpaceBelow,
      metrics.breadcrumbTitleHeight,
      metrics.breadcrumbRowWidth,
      metrics.headerHeight,
      metrics.headerWidth,
      metrics.headerOffset,
      metrics.headerTopValue,
      metrics.navigationRowHeight,
      navigation,
      scrollYValue,
      tags,
    ]);

    useNearestScroll(
      headerRef,
      // on scroll or various layout changes check updates if needed
      ({ current }) => {
        setPageHeaderStyles((prev) => ({
          ...prev,
          [`--${blockClass}--breadcrumb-top`]: `${metrics.headerOffset}px`,
        }));

        const fullyCollapsed =
          current.scrollY + metrics.headerTopValue + metrics.headerOffset >= 0;
        setFullyCollapsed(fullyCollapsed);

        // set offset for tagset tooltip
        /* istanbul ignore next */
        const tagsetTooltipOffset = fullyCollapsed
          ? metrics.headerHeight + metrics.headerTopValue + metrics.headerOffset
          : metrics.headerHeight + metrics.headerOffset;

        /* istanbul ignore next */
        document.documentElement.style.setProperty(
          `--${blockClass}--tagset-tooltip-position`,
          fullyCollapsed ? 'fixed' : 'absolute'
        );

        document.documentElement.style.setProperty(
          `--${blockClass}--tagset-tooltip-offset`,
          `${tagsetTooltipOffset}px`
        );

        setScrollYValue(current.scrollY);
      },
      [
        metrics.headerHeight,
        metrics.headerTopValue,
        metrics.headerOffset,
        disableBreadcrumbScroll,
      ]
    );

    useWindowResize(() => {
      // on window resize and other updates some values may have changed
      checkUpdateVerticalSpace();
    }, [
      actionBarItems,
      children,
      breadcrumbs,
      disableBreadcrumbScroll,
      navigation,
      pageActions,
      subtitle,
      tags,
      title,
    ]);

    useEffect(() => {
      checkUpdateVerticalSpace();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fullWidthGrid, narrowGrid]);

    useEffect(() => {
      // Determines if the hasBackgroundAlways should be one based on the header height or scroll
      let result = hasBackgroundAlways && 1;

      if (
        !result &&
        metrics.headerHeight > 0 &&
        (breadcrumbs || actionBarItems || tags || navigation)
      ) {
        const startAddingAt = parseFloat(layout05, 10) * parseInt(baseFontSize);
        const scrollRemaining = metrics.headerHeight - scrollYValue;

        /* don't know how to test resize */
        /* istanbul ignore if */
        if (scrollRemaining < startAddingAt) {
          const distanceAddingOver =
            startAddingAt - metrics.breadcrumbRowHeight;
          result = Math.min(
            1,
            (startAddingAt - scrollRemaining) / distanceAddingOver
          );
        }
      }

      setPageHeaderStyles((prev) => ({
        ...prev,
        [`--${blockClass}--background-opacity`]: result,
      }));

      setBackgroundOpacity(result);
    }, [
      actionBarItems,
      hasBackgroundAlways,
      breadcrumbs,
      headerRef,
      metrics.breadcrumbRowHeight,
      metrics.headerHeight,
      navigation,
      scrollYValue,
      hasCollapseHeaderToggle,
      tags,
    ]);

    useEffect(() => {
      // only has toggle if requested and has hasBackgroundAlways
      // NOTE: prop-types isRequired.if for the expand and collapse
      // icon descriptions depends on the this.
      setHasCollapseButton(hasCollapseHeaderToggle && hasBackgroundAlways);
    }, [hasBackgroundAlways, hasCollapseHeaderToggle]);

    useEffect(() => {
      // Determine if space is needed in the breadcrumb for a collapse button
      setSpaceForCollapseButton(
        hasCollapseButton && !(navigation || tags) && metrics.headerHeight
      );
    }, [hasCollapseButton, navigation, tags, metrics.headerHeight]);

    const nextToTabsCheck = () => {
      /* istanbul ignore next */
      return (
        disableBreadcrumbScroll &&
        actionBarItems === undefined &&
        scrollYValue + metrics.headerTopValue >= 0
      );
    };

    useEffect(() => {
      if (typeof collapseHeader === 'boolean') {
        utilSetCollapsed(
          collapseHeader,
          metrics.headerOffset,
          metrics.headerTopValue
        );
      }
    }, [collapseHeader, metrics.headerOffset, metrics.headerTopValue]);

    const {
      text: titleText,
      icon: TitleIcon,
      loading: titleLoading,
    } = titleShape;

    useResizeDetector({
      onResize: handleResizeActionBarColumn,
      targetRef: sizingContainerRef,
      handleWidth: true,
    });

    useResizeDetector({
      onResize: handleResize,
      targetRef: headerRef,
      handleHeight: true,
    });

    let breadcrumbsInWithTitle;
    if (breadcrumbsIn) {
      breadcrumbsInWithTitle = !title
        ? breadcrumbsIn
        : breadcrumbsIn.concat({
            isCurrentPage: true,
            className: cx([
              `${blockClass}__breadcrumb-title`,
              {
                [`${blockClass}__breadcrumb-title--pre-collapsed`]:
                  collapseTitle,
              },
            ]),
            key: `breadcrumb-title`,
            label: <span>{titleLoading ? <SkeletonText /> : titleText}</span>,
            title: titleText,
          });
    }

    return (
      <>
        <div
          className={`${blockClass}--offset-top-measuring-element`}
          ref={offsetTopMeasuringRef}
        ></div>
        <section
          {...rest}
          className={cx([
            blockClass,
            `${blockClass}--no-margins-below-row`,
            className,
            {
              [`${blockClass}--show-background`]: backgroundOpacity > 0,
              [`${blockClass}--has-navigation`]: navigation || tags,
              [`${blockClass}--has-navigation-tags-only`]: !navigation && tags,
            },
          ])}
          style={pageHeaderStyles}
          ref={headerRef}
          {...getDevtoolsProps(componentName)}
        >
          <Grid
            fullWidth={fullWidthGrid === true || fullWidthGrid === 'xl'}
            narrow={narrowGrid}
            className={cx({
              [`${blockClass}--width--xl`]: fullWidthGrid === 'xl',
            })}
          >
            <div className={`${blockClass}__non-navigation-row-content`}>
              {hasBreadcrumbRow ? (
                <Row
                  className={cx(`${blockClass}__breadcrumb-row`, {
                    [`${blockClass}__breadcrumb-row--next-to-tabs`]:
                      nextToTabsCheck(),
                    [`${blockClass}__breadcrumb-row--has-breadcrumbs`]:
                      breadcrumbs,
                    [`${blockClass}__breadcrumb-row--has-action-bar`]:
                      hasActionBar,
                  })}
                >
                  <div className={`${blockClass}__breadcrumb-row--container`}>
                    <Column
                      className={cx(`${blockClass}__breadcrumb-column`, {
                        [`${blockClass}__breadcrumb-column--background`]:
                          breadcrumbs !== undefined || hasActionBar,
                      })}
                    >
                      {/* keeps actionBar right even if empty */}

                      {breadcrumbs !== undefined ? (
                        <BreadcrumbWithOverflow
                          className={`${blockClass}__breadcrumb`}
                          noTrailingSlash={title !== undefined}
                          overflowAriaLabel={breadcrumbOverflowAriaLabel}
                          breadcrumbs={breadcrumbsInWithTitle}
                        >
                          {!breadcrumbsIn ? deprecated_breadcrumbItems : null}
                          {!breadcrumbsIn && title ? (
                            <BreadcrumbItem
                              isCurrentPage={true}
                              className={cx([
                                `${blockClass}__breadcrumb-title`,
                                {
                                  [`${blockClass}__breadcrumb-title--pre-collapsed`]:
                                    collapseTitle,
                                },
                              ])}
                            >
                              <span>
                                {titleLoading ? <SkeletonText /> : titleText}
                              </span>
                            </BreadcrumbItem>
                          ) : null}
                        </BreadcrumbWithOverflow>
                      ) : null}
                    </Column>
                    <Column
                      className={cx([
                        `${blockClass}__action-bar-column ${blockClass}__action-bar-column--background`,
                        {
                          [`${blockClass}__action-bar-column--has-page-actions`]:
                            pageActions,
                          [`${blockClass}__action-bar-column--influenced-by-collapse-button`]:
                            spaceForCollapseButton,
                        },
                      ])}
                    >
                      <div
                        className={`${blockClass}__action-bar-column-content`}
                        ref={sizingContainerRef}
                      >
                        {hasActionBar ? (
                          // Investigate the responsive  behaviour or this and the title also fix the ActionBar Item and PageAction story css
                          <>
                            {pageActions && (
                              <div
                                className={cx(`${blockClass}__page-actions`, {
                                  [`${blockClass}__page-actions--in-breadcrumb`]:
                                    pageActionsInBreadcrumbRow,
                                })}
                              >
                                <ButtonSetWithOverflow
                                  className={`${blockClass}__button-set--in-breadcrumb`}
                                  onWidthChange={handleButtonSetWidthChange}
                                  buttons={pageActionsItemArray}
                                  buttonSetOverflowLabel={
                                    pageActionsOverflowLabel
                                  }
                                />
                              </div>
                            )}
                            <ActionBar
                              overflowAriaLabel={actionBarOverflowAriaLabel}
                              actions={actionBarItemArray}
                              className={`${blockClass}__action-bar`}
                              onWidthChange={handleActionBarWidthChange}
                              rightAlign={true}
                            />
                          </>
                        ) : null}
                      </div>
                    </Column>
                  </div>
                </Row>
              ) : null}

              {!collapseTitle &&
              !(title === undefined && pageActions === undefined) ? (
                <Row
                  className={cx(`${blockClass}__title-row`, {
                    [`${blockClass}__title-row--no-breadcrumb-row`]:
                      !hasBreadcrumbRow,
                    [`${blockClass}__title-row--under-action-bar`]:
                      hasActionBar,
                    [`${blockClass}__title-row--has-page-actions`]:
                      pageActions !== undefined,
                    [`${blockClass}__title-row--sticky`]:
                      pageActions !== undefined &&
                      actionBarItems === undefined &&
                      hasBreadcrumbRow,
                  })}
                >
                  <Column className={`${blockClass}__title-column`}>
                    {/* keeps page actions right even if empty */}
                    {title !== undefined ? (
                      <div
                        className={cx(`${blockClass}__title`, {
                          [`${blockClass}__title--fades`]: hasBreadcrumbRow,
                        })}
                      >
                        {TitleIcon && !titleLoading ? (
                          <TitleIcon className={`${blockClass}__title-icon`} />
                        ) : null}
                        <span title={!titleLoading ? titleText : null}>
                          {titleLoading ? (
                            <SkeletonText
                              className={`${blockClass}__title-skeleton`}
                            />
                          ) : (
                            titleText
                          )}
                        </span>
                      </div>
                    ) : null}
                  </Column>

                  {pageActions !== undefined ? (
                    <Column
                      className={cx(`${blockClass}__page-actions`, {
                        [`${blockClass}__page-actions--in-breadcrumb`]:
                          pageActionsInBreadcrumbRow,
                      })}
                    >
                      <ButtonSetWithOverflow
                        className={`${blockClass}__page-actions-container`}
                        onWidthChange={handleButtonSetWidthChange}
                        buttons={pageActionsItemArray}
                        buttonSetOverflowLabel={pageActionsOverflowLabel}
                      />
                    </Column>
                  ) : null}
                </Row>
              ) : null}

              {subtitle !== undefined ? (
                <Row className={`${blockClass}__subtitle-row`}>
                  <Column className={`${blockClass}__subtitle`}>
                    {subtitle}
                  </Column>
                </Row>
              ) : null}

              {children !== undefined ? (
                <Row className={`${blockClass}__available-row`}>
                  <Column className={`${blockClass}__available-column`}>
                    {children}
                  </Column>
                </Row>
              ) : null}

              {/* Last row margin-below causes problems for scroll behaviour when it sticks the header.
            This buffer is used in CSS instead to add vertical space after the last row
            */}
              {(breadcrumbs ||
                actionBarItems ||
                title ||
                pageActions ||
                children ||
                subtitle) && (
                <div
                  className={cx([
                    `${blockClass}__last-row-buffer`,
                    {
                      [`${blockClass}__last-row-buffer--active`]:
                        lastRowBufferActive,
                    },
                  ])}
                ></div>
              )}

              {
                // this navigation row scrolls under the breadcrumb if there is one
                tags && !navigation ? (
                  <Row
                    className={cx(`${blockClass}__navigation-row`, {
                      [`${blockClass}__navigation-row--has-tags`]: tags,
                    })}
                  >
                    <Column
                      className={cx(`${blockClass}__navigation-tags`, {
                        [`${blockClass}__navigation-tags--tags-only`]:
                          navigation === undefined,
                      })}
                    >
                      <TagSet
                        overflowAlign="end"
                        {...{
                          allTagsModalSearchLabel,
                          allTagsModalSearchPlaceholderText,
                          allTagsModalTitle,
                          showAllTagsLabel,
                          tags,
                        }}
                      />
                    </Column>
                  </Row>
                ) : null
              }
            </div>

            {
              // this navigation pushes the breadcrumb off or settles underneath it depending on disableBreadcrumbScroll
              navigation ? (
                <Row
                  className={cx(`${blockClass}__navigation-row`, {
                    [`${blockClass}__navigation-row--spacing-above-06`]:
                      navigation !== undefined,
                    [`${blockClass}__navigation-row--has-tags`]: tags,
                  })}
                >
                  <Column className={`${blockClass}__navigation-tabs`}>
                    {navigation}
                  </Column>
                  {tags !== undefined ? (
                    <Column
                      className={cx(`${blockClass}__navigation-tags`, {
                        [`${blockClass}__navigation-tags--tags-only`]:
                          navigation === undefined,
                      })}
                    >
                      <TagSet
                        overflowAlign="end"
                        {...{
                          allTagsModalSearchLabel,
                          allTagsModalSearchPlaceholderText,
                          allTagsModalTitle,
                          showAllTagsLabel,
                          tags,
                        }}
                      />
                    </Column>
                  ) : null}
                </Row>
              ) : null
            }
          </Grid>
          {hasCollapseButton ? (
            <Button
              className={cx(`${blockClass}__collapse-expand-toggle`, {
                [`${blockClass}__collapse-expand-toggle--collapsed`]:
                  fullyCollapsed,
              })}
              hasIconOnly={true}
              iconDescription={
                /* istanbul ignore next */
                fullyCollapsed
                  ? expandHeaderIconDescription
                  : collapseHeaderIconDescription
              }
              kind="ghost"
              onClick={handleCollapseToggle}
              renderIcon={ChevronUp16}
              size="field"
              tooltipPosition="bottom"
              tooltipAlignment="end"
              type="button"
            />
          ) : null}
        </section>
      </>
    );
  }
);

// Return a placeholder if not released and not enabled by feature flag
PageHeader = pkg.checkComponentEnabled(PageHeader, componentName);

// copied from carbon-components-react/src/components/Tag/Tag.js for DocGen
const TYPES = {
  red: 'Red',
  magenta: 'Magenta',
  purple: 'Purple',
  blue: 'Blue',
  cyan: 'Cyan',
  teal: 'Teal',
  green: 'Green',
  gray: 'Gray',
  'cool-gray': 'Cool-Gray',
  'warm-gray': 'Warm-Gray',
  'high-contrast': 'High-Contrast',
};
const tagTypes = Object.keys(TYPES);

export const deprecatedProps = {
  /**
   * **Deprecated** see property `actionBarOverflowAriaLabel`
   */
  actionBarOverflowLabel: deprecateProp(
    PropTypes.string,
    'Property renamed to `actionBarOverflowAriaLabel`.'
  ),
  /**
   * **Deprecated** see property `children`
   */
  availableSpace: deprecateProp(
    PropTypes.node,
    'Make use of children instead.'
  ),
  /**
   * **Deprecated** see property `hasBackgroundAlways`
   */
  background: deprecateProp(
    PropTypes.bool,
    'Property renamed to `hasBackgroundAlways`'
  ),
  /**
   * **Deprecated** see property `breadcrumbs`
   */
  breadcrumbItems: deprecateProp(
    PropTypes.element,
    'Usage changed to expect breadcrumb item like shapes, see `breadcrumbs`.'
  ),
  /**
   * **Deprecated** see property `breadcrumbOverflowAriaLabel`
   */
  breadcrumbOverflowLabel: deprecateProp(
    PropTypes.string,
    'Property renamed to `breadcrumbOverflowAriaLabel`.'
  ),
  /**
   * **Deprecated** see property `collapseHeaderIconDescription`
   */
  collapseHeaderLabel: deprecateProp(
    PropTypes.string,
    'Property renamed to `collapseHeaderIconDescription`.'
  ),
  /**
   * **Deprecated** see property `hasCollapseHeaderToggle`
   */
  collapseHeaderToggleWanted: deprecateProp(
    PropTypes.bool,
    'Property renamed to `hasCollapseHeaderToggle`'
  ),
  /**
   * **Deprecated** see property `expandHeaderIconDescription`
   */
  expandHeaderLabel: deprecateProp(
    PropTypes.string,
    'Property renamed to `expandHeaderIconDescription`.'
  ),
  /**
   * **Deprecated** no longer required
   */
  pageHeaderOffset: deprecateProp(
    PropTypes.number,
    'Property removed as no longer required.'
  ),
  /**
   * **Deprecated** see property `collapseTitle`
   */
  preCollapseTitleRow: deprecateProp(
    PropTypes.bool,
    'Property renamed to `collapseTitle`.'
  ),
  /**
   * **Deprecated** see property `disableBreadcrumbScroll`
   */
  preventBreadcrumbScroll: deprecateProp(
    PropTypes.bool,
    'Prop renamed to `disableBreadcrumbScroll`.'
  ),
  /**
   * **Deprecated** see property `title object form`
   */
  titleIcon: deprecateProp(
    PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    'Use `title` prop shape instead.'
  ),
};

PageHeader.propTypes = {
  /**
   * Specifies the action bar items which are the final items in the row top of the PageHeader.
   * Each item is specified as an object with the properties of a Carbon Button in icon only form.
   * Button kind, size, tooltipPosition, tooltipAlignment and type are ignored.
   */
  actionBarItems: deprecatePropUsage(
    PropTypes.arrayOf(
      PropTypes.shape({
        ...prepareProps(Button.propTypes, [
          'kind',
          'size',
          'tooltipPosition',
          'tooltipAlignment',
        ]),
        iconDescription: PropTypes.string.isRequired,
        onClick: Button.propTypes.onClick,
        renderIcon: Button.propTypes.renderIcon.isRequired,
      })
    ),

    // expects action bar item as array or in fragment
    PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.element),
      PropTypes.element,
    ]),
    'Expects an array of objects with the following properties: iconDescription, renderIcon and onClick.'
  ),
  /**
   * When there is insufficient space for all actionBarItems to be displayed this
   * aria label is used for the action bar overflow menu
   *
   * NOTE: This prop is required if actionBarItems are supplied
   */
  actionBarOverflowAriaLabel: PropTypes.string.isRequired.if(
    ({ actionBarItems, actionBarOverflowLabel }) =>
      actionBarItems && actionBarItems.length > 0 && !actionBarOverflowLabel
  ),
  /**
   * When tags are supplied there may not be sufficient space to display all of the tags. This results in an overflow
   * menu being shown. If in the overflow menu there is still insufficient space this label is used in a dialog showing
   * all tags.
   *
   * **Note: Required if more than 10 tags**
   */
  allTagsModalSearchLabel: string_required_if_more_than_10_tags,
  /**
   * When tags are supplied there may not be sufficient space to display all of the tags. This results in an overflow
   * menu being shown. If in the overflow menu there is still insufficient space this placeholder is used in a dialog
   * showing all tags.
   *
   * **Note: Required if more than 10 tags**
   */
  allTagsModalSearchPlaceholderText: string_required_if_more_than_10_tags,
  /**
   * When tags are supplied there may not be sufficient space to display all of the tags. This results in an overflow
   * menu being shown. If in the overflow menu there is still insufficient space this title is used in a dialog showing
   * all tags.
   *
   * **Note: Required if more than 10 tags**
   */
  allTagsModalTitle: string_required_if_more_than_10_tags,
  /**
   * If the user supplies breadcrumbs then this property is required.
   * It is used in an overflow menu when there is insufficient space to display all breadcrumbs inline.
   */
  breadcrumbOverflowAriaLabel: PropTypes.string.isRequired.if(
    ({ breadcrumbs, breadcrumbItems }) =>
      (breadcrumbs && breadcrumbs.length > 0) ||
      (breadcrumbItems && breadcrumbItems.length > 0)
  ),
  /**
   * Specifies the breadcrumb components to be shown in the breadcrumb area of
   * the page header. Each item is specified as an object with optional fields
   * 'label' to supply the breadcrumb label, 'href' to supply the link location,
   * and 'isCurrentPage' to specify whether this breadcrumb component represents
   * the current page. Each item should also include a unique 'key' field to
   * enable efficient rendering, and if the label is not a string then a 'title'
   * field is required to provide a text alternative for display. Any other
   * fields in the object will be passed through to the breadcrumb element as
   * HTML attributes.
   */
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      /**
       * Optional string representing the link location for the BreadcrumbItem
       */
      href: PropTypes.string,

      /**
       * Provide if this breadcrumb item represents the current page
       */
      isCurrentPage: PropTypes.bool,

      /**
       * Key required to render array efficiently
       */
      key: PropTypes.string.isRequired,

      /**
       * Pass in content that will be inside of the BreadcrumbItem
       */
      label: PropTypes.node,

      /**
       * A text version of the `label` for display, required if `label` is not a string.
       */
      title: PropTypes.string.isRequired.if(
        ({ label }) => typeof label !== 'string'
      ),
    })
  ),
  /**
   * A zone for placing high-level, client content above the page tabs.
   * Accepts arbitrary renderable content as a React node. Optional.
   */
  children: PropTypes.node,
  /**
   * Specifies class(es) to be applied to the top-level PageHeader node.
   * Optional.
   */
  className: PropTypes.string,
  /**
   * The header can as a whole be collapsed, expanded or somewhere in between.
   * This setting controls the initial value, but also takes effect on change
   *
   * NOTE: The header is collapsed by setting the scroll position to hide part of the header.
   * Collapsing has no effect if there is insufficient content to scroll.
   */
  collapseHeader: PropTypes.bool,
  /**
   * If `hasCollapseHeaderToggle` and `hasBackgroundAlways` are set then assistive text is required
   * for both the expend and collapse states of the button component used.
   */
  collapseHeaderIconDescription: PropTypes.string.isRequired.if(
    ({ hasBackgroundAlways, hasCollapseHeaderToggle }) =>
      hasBackgroundAlways && hasCollapseHeaderToggle
  ),
  /**
   * The title row typically starts below the breadcrumb row. This option
   * preCollapses it into the breadcrumb row.
   */
  collapseTitle: PropTypes.bool,
  /**
   * Standard behavior scrolls the breadcrumb off to leave just tabs. This
   * option preserves vertical space for both the breadcrumb and tabs if they're supplied.
   */
  disableBreadcrumbScroll: PropTypes.bool,
  /**
   * If `hasCollapseHeaderToggle` and `hasBackgroundAlways` are set then assistive text is required
   * for both the expend and collapse states of the button component used.
   */
  expandHeaderIconDescription: PropTypes.string.isRequired.if(
    ({ hasBackgroundAlways, hasCollapseHeaderToggle }) =>
      hasBackgroundAlways && hasCollapseHeaderToggle
  ),
  /**
   * The PageHeader is hosted in a Carbon grid, this value is passed through to the Carbon grid fullWidth prop.
   * 'xl' is used to override the grid width setting. Can be used with narrowGrid: true to get the largest size.
   */
  fullWidthGrid: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf('xl')]),
  /**
   * Specifies if the PageHeader should have a background always on and defaults to the preferred `true`.
   * When false some parts of the header gain a background if they stick to the top of the PageHeader on scroll.
   */
  hasBackgroundAlways: PropTypes.bool,
  /**
   * Adds a button as the last element of the bottom row which collapses and expands the header.
   *
   * NOTE: The header is collapsed by setting the scroll position to hide part of the header.
   * Collapsing has no effect if there is insufficient content to scroll.
   */
  hasCollapseHeaderToggle: PropTypes.bool,
  /**
   * The PageHeader is hosted in a Carbon grid, this value is passed through to the Carbon grid narrow prop
   */
  narrowGrid: PropTypes.bool,
  /**
   * Content for the navigation area in the PageHeader. Should
   * be a React element that is normally a Carbon Tabs component. Optional.
   */
  navigation: PropTypes.element, // Supports Tabs
  /**
   * Specifies the primary page actions which are placed at the same level in the page as the title.
   *
   * Each action is specified as an object with the properties of a Carbon Button plus:
   * - label: node
   *
   * Carbon Button API https://react.carbondesignsystem.com/?path=/docs/components-button--default#component-api
   */
  pageActions: deprecatePropUsage(
    PropTypes.arrayOf(
      PropTypes.shape({
        ...Button.propTypes,
        key: PropTypes.string.isRequired,
        kind: Button.propTypes.kind,
        label: PropTypes.node,
        onClick: PropTypes.func,
      })
    ),
    PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.element),
      PropTypes.element,
    ]),
    'Expects an array of objects with the following properties: label and onClick.'
  ),
  /**
   * When there is insufficient space to display all of hte page actions inline a dropdown button menu is shown,
   * containing the page actions. This label is used as the display content of the dropdown button menu.
   *
   * NOTE: This prop is required if pageActions are supplied
   */
  pageActionsOverflowLabel: PropTypes.node.isRequired.if(
    ({ pageActions }) => pageActions && pageActions.length > 0
  ),
  /**
   * When tags are supplied there may not be sufficient space to display all of the tags. This results in an overflow
   * menu being shown. If in the overflow menu there is still insufficient space this label is used to offer a
   * "View all tags" option.
   *
   * **Note: Required if more than 10 tags**
   */
  showAllTagsLabel: string_required_if_more_than_10_tags,
  /**
   * Sitting just below the title is this optional subtitle that provides additional context to
   * identify the current page.
   */
  subtitle: PropTypes.string,
  /**
   * An array of tags to be shown as the final content in the PageHeader.
   *
   * Each tag is specified as an object with the following properties
   * **label**\* (required) to supply the tag content, and properties of the the Carbon Tag component,
   * such as **type**, **disabled**, **ref**, **className** , and any other Tag props.
   *
   * NOTE: **filter** is not supported. Any remaining fields in the object will be passed through to the HTML element
   * as HTML attributes.
   *
   * See https://react.carbondesignsystem.com/?path=/docs/components-tag--default
   */
  tags: PropTypes.arrayOf(
    PropTypes.shape({
      ...prepareProps(Tag.propTypes, 'filter'),
      label: PropTypes.string.isRequired,
      // we duplicate this prop to improve the DocGen
      type: PropTypes.oneOf(tagTypes),
    })
  ),
  /**
   * An optional page title supplied as a string or object with the following attributes: text, icon, loading
   */
  title: PropTypes.oneOfType([
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      icon: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
      loading: PropTypes.bool,
    }),
    PropTypes.string,
  ]),
  ...deprecatedProps,
};

PageHeader.defaultProps = {
  fullWidthGrid: false,
  hasBackgroundAlways: true,
  narrowGrid: false,
};

PageHeader.displayName = componentName;
