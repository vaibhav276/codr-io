define(function(require)
{
    // Dependencies.
    var $        = require('jquery'),
        oHelpers = require('helpers/helpers-web'),
        Keyable  = require('helpers/keyable');

    return oHelpers.createClass(
    {
        _aFavOptions: null,
        _aNormalOptions: null,
        _iNumFavorites: 0,
        _fnOnSelect: null,
        _jMenu: null,
        _oKeyable: null,
        _sLastQuery: '',
        
        __init__: function(aOptions, jParent, iNumFavoriteOptions, oScope, fnGetKey, fnGetDisplayText, fnOnSelect)
        {
            // Save options.
            this._aNormalOptions = aOptions.slice(iNumFavoriteOptions);
            this._aFavOptions = aOptions.slice(0, iNumFavoriteOptions);
            
            // Map options by key.
            this._oOptionsByKey = {};
            for (var iOptionIndex in aOptions)
            {
                var oOption = aOptions[iOptionIndex];
                this._oOptionsByKey[fnGetKey(oOption)] = oOption;
            }
            
            // Save callbacks.
            this._fnGetKey          = oHelpers.createCallback(oScope, fnGetKey);
            this._fnGetDisplayText  = oHelpers.createCallback(oScope, fnGetDisplayText);
            this._fnOnSelect        = oHelpers.createCallback(oScope, fnOnSelect);
        
            // Init.
            this._jMenu = $(
                '<div class="menu" >' +
                    '<div class="menu-search">'+
                        '<input type="text" autocomplete="off"/>' +
                    '</div>' + 
                    '<div class="menu-options" tabIndex="-1">' + // Tab index for FF.
                    '</div>' +
                '</div>'
            );
            this._oKeyable = new Keyable(this._jMenu);
            this._renderOptions();
            $(jParent).append(this._jMenu);
            this._oKeyable.attach();
            this._oKeyable.update();
        },
        
        focusInput: function()
        {
            this._jMenu.find('.menu-search input').focus();
        },
        
        onEvent: function(oEvent)
        {
            var jTarget = $(oEvent.target);
            var bMenuDisabled = $('.menu').hasClass('disabled');
            switch(oEvent.type)
            {
                case 'click':
                    var jOption = jTarget.closest('.option');
                    if (jOption.length && !bMenuDisabled)
                    {
                        this._oKeyable.select(jOption);
                        this._selectCur();
                    }
                    break;
                
                case 'keyup':
    
                    this._assertInputFocus();
                    var sQuery = this._jMenu.find('.menu-search input').val();
                    if (this._sLastQuery != sQuery)
                        this._renderOptions(sQuery);
                    this._sLastQuery = sQuery;
                    break;
                
                case 'keydown':
                    
                    this._assertInputFocus();
                    switch (oEvent.which)
                    {
                        // Select next down div
                        case 40: // Down arrow
                            this._oKeyable.moveDown();
                            this._scrollIntoView(this._oKeyable.getSelected());
                            oEvent.preventDefault();
                            break;
                        
                        // Select next up div
                        case 38: // Up arrow
                            this._oKeyable.moveUp();
                            this._scrollIntoView(this._oKeyable.getSelected());
                            oEvent.preventDefault();
                            break;
                
                        // On choice
                        case 13:
                            if(!bMenuDisabled)
                            {
                                this._selectCur();
                                oEvent.preventDefault();
                            }
                            break;
                    }        
                    break;
            }
        },
        
        highlight: function(oOption)
        {
            var jOption = this._jMenu.find('.option' + this._fnGetKey(oOption));
            oHelpers.assert(jOption.length, 'Option not visible. ');
            this._oKeyable.select(jOption);
            this._scrollIntoView(jOption);
        },
            
        _renderOptions: function(sOptionalFilter)
        {
            // Clear old options.
            var jOptionsParent = this._jMenu.children('.menu-options');
            jOptionsParent.empty();
        
            // Filter options.
            var sSearch = (sOptionalFilter || '').toLowerCase();
            var aFavOptions    = this._grepOptions(this._aFavOptions   , sSearch);
            var aNormalOptions = this._grepOptions(this._aNormalOptions, sSearch);
            
            // Create favorite options.
            if (aFavOptions.length)
            {
                var jFavs = $('<div class="menu-favs"></div>').appendTo(jOptionsParent);
                for (var i = 0; i < aFavOptions.length; i++)
                    this._appendOption(jFavs, aFavOptions[i]);
            }
            
            // Create normal options.
            for (var i = 0; i < aNormalOptions.length; i++)
                this._appendOption(jOptionsParent, aNormalOptions[i]);
            
            // Update keyable.
            this._oKeyable.update();
        },
        
        _grepOptions: function(aOptions, sSearch)
        {
            return $.grep(aOptions, oHelpers.createCallback(this, function(oOption)
            {
                return this._fnGetDisplayText(oOption).toLowerCase().indexOf(sSearch) != -1;
            }));
        },
        
        _appendOption: function(jParent, oOption)
        {
            var jOption = $('<div class="option keyable mode"></div>');
            jOption.text(this._fnGetDisplayText(oOption)).attr('id', this._fnGetKey(oOption));
            jParent.append(jOption);
        },
        
        _scrollIntoView: function(jElem)
        {
            // Calculate the element's position.
            var jViewport = jElem.offsetParent();
            var iTop = jElem.position().top - parseInt(jViewport.css('paddingTop'));
            var iBottom = jViewport[0].clientHeight - (iTop + jElem[0].offsetHeight)
                
            // Scroll element vertically into view.
            var iScrollTop = null;
            if (iTop < 0)
            {
                iScrollTop = jViewport.scrollTop() + iTop;
                jViewport.scrollTop(iScrollTop);
            }
            else if (iBottom < 0)
            {
                iScrollTop = jViewport.scrollTop() - iBottom;
                jViewport.scrollTop(iScrollTop);
            }
        },
        
        _selectCur: function()
        {
            var sKey = this._oKeyable.getSelected().attr('id');
            this._fnOnSelect(this._oOptionsByKey[sKey]);
            this._jMenu.find('input').val('');
            this._renderOptions();
        },
        
        _assertInputFocus: function()
        {
            if (document.activeElement != this._jMenu.find('.menu-search input')[0])
            {
                oHelpers.assert(false, 'The menu input does not have focus.');
            }
        }
    });
});