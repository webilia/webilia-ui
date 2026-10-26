(() => {
  // assets/wordpress/js/settings-customizer.js
  (function($, api) {
    const boundPanelIds = {};
    const boundSectionIds = {};
    const childParentMap = {};
    let openingTargetId = null;
    function uniqueIds(ids) {
      const seen = {};
      return $.grep(ids, function(id) {
        if (!id || seen[id]) return false;
        seen[id] = true;
        return true;
      });
    }
    function getChildIds() {
      const ids = [];
      $(".wui-sp-customizer-subsection-link").each(function() {
        const id = $(this).data("wuiSpSection");
        if (id) ids.push(id);
      });
      return uniqueIds(ids);
    }
    function hideSections(ids, exceptId) {
      $.each(ids, function(_, id) {
        const section = api.section(id);
        if (!section || !section.container) return;
        if (exceptId && id === exceptId) {
          section.container.removeClass("wui-sp-customizer-child-hidden");
        } else {
          section.container.addClass("wui-sp-customizer-child-hidden");
        }
      });
    }
    function getParentSectionId($link) {
      const $section = $link.closest('.control-section[id^="accordion-section-"]');
      if (!$section.length) return null;
      const rawId = $section.attr("id") || "";
      if (rawId.indexOf("accordion-section-") === 0) {
        return rawId.replace("accordion-section-", "");
      }
      return null;
    }
    function getParentSectionIdForChild(childId) {
      const $link = $(".wui-sp-customizer-subsection-link").filter(function() {
        return $(this).data("wuiSpSection") === childId;
      }).first();
      if ($link.length) {
        return getParentSectionId($link);
      }
      return null;
    }
    function openSection(sectionId, panelId) {
      if (!sectionId) return;
      openingTargetId = sectionId;
      api.section(sectionId, function(section) {
        if (section.container) {
          section.container.removeClass("wui-sp-customizer-child-hidden");
        }
        const complete = function() {
          const childIds = getChildIds();
          hideSections(childIds, sectionId);
          openingTargetId = null;
        };
        if (section.expand) {
          section.expand({ completeCallback: complete });
        } else {
          complete();
        }
      });
    }
    function bindPanelListeners() {
      if (!api.panel || !api.panel.each) return;
      api.panel.each(function(panel) {
        const panelId = panel && (panel.id || panel.params && panel.params.id);
        if (!panelId || boundPanelIds[panelId]) return;
        if (!panel.expanded || !panel.expanded.bind) return;
        boundPanelIds[panelId] = true;
        panel.expanded.bind(function(expanded) {
          if (!expanded) return;
          if (openingTargetId) return;
          if (api.state && api.state("expandedSection") && api.state("expandedSection").get()) return;
          setTimeout(function() {
            if (openingTargetId) return;
            if (api.state && api.state("expandedSection") && api.state("expandedSection").get()) return;
            const childIds = getChildIds();
            hideSections(childIds);
          }, 0);
        });
      });
    }
    function bindSubsectionLinks() {
      const $links = $(".wui-sp-customizer-subsection-link");
      if (!$links.length) return;
      bindPanelListeners();
      bindSectionListeners();
      const childIds = getChildIds();
      let keepId = openingTargetId;
      if (!keepId && api.state && api.state("expandedSection") && api.state("expandedSection").get()) {
        keepId = api.state("expandedSection").get().id;
      }
      hideSections(childIds, keepId);
      setTimeout(function() {
        hideSections(childIds, keepId);
      }, 0);
    }
    function bindSectionListeners() {
      const childIds = getChildIds();
      $.each(childIds, function(_, id) {
        if (boundSectionIds[id]) return;
        const section = api.section(id);
        if (!section || !section.expanded || !section.expanded.bind) return;
        boundSectionIds[id] = true;
        section.expanded.bind(function(expanded) {
          if (expanded) return;
          if (openingTargetId) return;
          const ids = getChildIds();
          hideSections(ids);
          const parentId = childParentMap[id] || getParentSectionIdForChild(id);
          if (parentId) {
            api.section(parentId, function(parentSection) {
              if (parentSection && parentSection.expand) {
                parentSection.expand();
              }
              if (parentSection && parentSection.focus) {
                parentSection.focus();
              }
            });
          }
        });
      });
    }
    $(document).off("click.webilia", ".wui-sp-customizer-subsection-link").on("click.webilia", ".wui-sp-customizer-subsection-link", function(event) {
      event.preventDefault();
      const targetId = $(this).data("wuiSpSection");
      const panelId = $(this).data("wuiSpPanel");
      const parentId = getParentSectionId($(this));
      if (parentId) {
        childParentMap[targetId] = parentId;
      }
      openSection(targetId, panelId);
    });
    api.bind("ready", function() {
      bindSubsectionLinks();
    });
    api.bind("section-added", function() {
      bindSubsectionLinks();
    });
  })(jQuery, wp.customize);
})();
